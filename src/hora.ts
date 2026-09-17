import { getApplications } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";

// The bridge to hora Calendar.
//
// hora exposes an AppleScript dictionary (`hora.sdef` in the app repo) and
// every command answers with a JSON string, so each wrapper here is a script
// template plus a `JSON.parse`. The dictionary is the contract — if something
// is missing from this file, look there first.

/** hora ships through three channels, each with its own bundle identifier. */
const BUNDLE_IDS = ["szamowski.Hora", "szamowski.Hora-setapp", "szamowski.Hora-direct", "szamowski.Hora.dev"];

export class HoraNotInstalledError extends Error {
  constructor() {
    super("hora Calendar is not installed.");
    this.name = "HoraNotInstalledError";
  }
}

export class HoraNotAuthorizedError extends Error {
  constructor() {
    super("Raycast is not allowed to control hora Calendar.");
    this.name = "HoraNotAuthorizedError";
  }
}

let cachedBundleID: string | undefined;

/**
 * The installed channel, resolved once per command run.
 *
 * Matching on bundle id rather than on the application name, the way most
 * single-channel extensions do, because all three builds are called
 * "hora Calendar" — only the identifier tells them apart.
 */
export async function horaBundleID(): Promise<string> {
  if (cachedBundleID) return cachedBundleID;
  const installed = await getApplications();
  const match = BUNDLE_IDS.find((id) => installed.some((app) => app.bundleId === id));
  if (!match) throw new HoraNotInstalledError();
  cachedBundleID = match;
  return match;
}

/** Escapes a value for use inside an AppleScript string literal. */
function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Builds an AppleScript `date` from components rather than from a formatted
 * string. `date "18/09/2026"` is parsed with the user's regional settings, so
 * a literal that works here breaks on a machine set to another locale.
 *
 * Day is pinned to 1 before the month moves, or setting month to February
 * while the current date is the 31st rolls the date into March.
 */
function dateLiteral(variable: string, date: Date): string {
  return [
    `set ${variable} to current date`,
    `set day of ${variable} to 1`,
    `set year of ${variable} to ${date.getFullYear()}`,
    `set month of ${variable} to ${date.getMonth() + 1}`,
    `set day of ${variable} to ${date.getDate()}`,
    `set time of ${variable} to ${date.getHours() * 3600 + date.getMinutes() * 60}`,
  ].join("\n");
}

/**
 * Runs one command against hora and parses its JSON answer.
 *
 * `preamble` holds any statements that must run outside the `tell` block,
 * which in practice means date variables.
 */
async function tellHora<T>(command: string, preamble = ""): Promise<T> {
  const bundleID = await horaBundleID();
  const script = [preamble, `tell application id ${quote(bundleID)}`, `  ${command}`, "end tell"]
    .filter(Boolean)
    .join("\n");

  let output: string;
  try {
    output = await runAppleScript(script, { humanReadableOutput: true, timeout: 30_000 });
  } catch (error) {
    throw translate(error);
  }

  try {
    return JSON.parse(output) as T;
  } catch {
    throw new Error(`hora answered with something unexpected: ${output.slice(0, 200)}`);
  }
}

/**
 * Turns osascript's noise into something worth putting in a toast.
 *
 * hora's own failures arrive as `… got an error: <message>. (-10000)`, and the
 * message is already written for a person to read, so it is pulled out whole.
 */
function translate(error: unknown): Error {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes("-1743")) return new HoraNotAuthorizedError();
  if (raw.includes("-600") || raw.includes("-10814")) return new HoraNotInstalledError();
  const match = raw.match(/got an error:\s*(.+?)\s*\(-?\d+\)/s);
  return new Error(match ? match[1].replace(/\.$/, "") : raw);
}

// MARK: - Shapes answered by the dictionary

export interface HoraEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  calendarID: string;
  calendarName?: string;
  calendarColorHex?: string;
  accountEmail: string;
  location?: string;
  conferenceLink?: string;
}

export interface HoraCalendar {
  id: string;
  name: string;
  accountEmail: string;
  colorHex: string;
  isPrimary: boolean;
  canEdit: boolean;
  isVisible: boolean;
}

export interface HoraTaskList {
  id: string;
  name: string;
  accountEmail: string;
  isVisible: boolean;
}

export interface CreatedEvent extends HoraEvent {
  added: boolean;
  /**
   * False while the event still carries hora's local identifier — an offline
   * create keeps it until the pending mutation replays, and `id` will change
   * once it does.
   */
  synced: boolean;
}

export interface CreatedTask {
  id: string;
  title: string;
  listID: string;
  listName: string;
  accountEmail: string;
  due?: string;
  notes?: string;
}

// MARK: - Commands

/** Creates the event straight away. hora stays closed. */
export async function quickAddEvent(sentence: string, calendarName?: string): Promise<CreatedEvent> {
  const inCalendar = calendarName ? ` in calendar ${quote(calendarName)}` : "";
  return tellHora<CreatedEvent>(`parse sentence ${quote(sentence)} with add immediately${inCalendar}`);
}

/** Opens hora's editor with the sentence already parsed into the fields. */
export async function addEventForEditing(sentence: string): Promise<void> {
  await tellHora(`parse sentence ${quote(sentence)}`);
}

export async function addTask(input: {
  title: string;
  due?: Date;
  listName?: string;
  notes?: string;
}): Promise<CreatedTask> {
  const parts = [`add task ${quote(input.title)}`];
  let preamble = "";
  if (input.due) {
    preamble = dateLiteral("dueDate", input.due);
    parts.push("due on dueDate");
  }
  if (input.listName) parts.push(`in list ${quote(input.listName)}`);
  if (input.notes) parts.push(`notes ${quote(input.notes)}`);
  return tellHora<CreatedTask>(parts.join(" "), preamble);
}

export async function upcomingEvents(
  options: { limit?: number; withMeetingLinks?: boolean } = {},
): Promise<HoraEvent[]> {
  const parts = ["upcoming events"];
  if (options.limit) parts.push(`limited to ${options.limit}`);
  if (options.withMeetingLinks) parts.push("with meeting links");
  return tellHora<HoraEvent[]>(parts.join(" "));
}

export async function joinConference(eventID: string): Promise<{ conferenceLink: string; title: string }> {
  return tellHora(`join conference ${quote(eventID)}`);
}

export async function listCalendars(): Promise<HoraCalendar[]> {
  return tellHora<HoraCalendar[]>("list calendars");
}

export async function listTaskLists(): Promise<HoraTaskList[]> {
  return tellHora<HoraTaskList[]>("list task lists");
}
