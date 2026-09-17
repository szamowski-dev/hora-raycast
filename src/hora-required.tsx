import { Action, ActionPanel, Detail, Icon } from "@raycast/api";

export const HORA_WEBSITE = "https://horacal.app";
export const HORA_APP_STORE = "https://apps.apple.com/app/id6761409895";
export const HORA_SETAPP = "https://setapp.com/";

/**
 * What someone sees when the extension has nothing to talk to.
 *
 * Most people who land here found this extension in the Raycast Store without
 * knowing hora exists, so this screen is the only pitch the product gets. It
 * is written as one, not as an error.
 */
export function HoraRequired({ reason }: { reason: "missing" | "outdated" }) {
  const markdown =
    reason === "outdated"
      ? `# Update hora Calendar

Your copy of hora Calendar is older than 1.1.5 and cannot be controlled from Raycast yet.

Update it from wherever you installed it — the Mac App Store, Setapp, or **Check for Updates** in hora's menu — and this command will work right away.`
      : `# hora Calendar for Mac required

**Native Google Calendar for Mac.**

Create and join meetings without opening your browser.

Your calendar, your tasks, your meeting rooms and your invitations in one native app — no Electron, no web views. This extension is how you reach it from Raycast.

Available on the Mac App Store, on Setapp, or directly from horacal.app. Every channel includes a free trial, so you can try it before deciding.`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title={reason === "outdated" ? "Open Horacal.app" : "Get Hora Calendar"}
            icon={Icon.Download}
            url={HORA_WEBSITE}
          />
          <Action.OpenInBrowser title="Get on the Mac App Store" icon={Icon.AppWindow} url={HORA_APP_STORE} />
          <Action.OpenInBrowser title="Get on Setapp" icon={Icon.Box} url={HORA_SETAPP} />
        </ActionPanel>
      }
    />
  );
}
