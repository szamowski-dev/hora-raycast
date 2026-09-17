# hora Calendar for Raycast

Add events and tasks to [hora Calendar](https://horacal.app) and jump into your next meeting, without leaving Raycast.

## Commands

| Command | What it does |
| --- | --- |
| **Quick Add Event** | Turns a sentence into an event and saves it. hora never comes forward. |
| **Add Event** | Parses the same sentence, then opens hora's editor so you can adjust it before saving. |
| **Add Task** | Adds a task to one of your Google Tasks lists, with an optional due date and note. |
| **Join Meeting** | Lists upcoming meetings that have a link and opens the right one in the right account. |

Both event commands understand plain language — `lunch with Kuba on Thursday at 1pm`, `standup tomorrow 9:30`, `dentist next Friday`. hora does the parsing, so the result matches what you would get by typing the same sentence into the app.

## Requirements

- macOS, and hora Calendar 1.1.5 or newer. Earlier versions have no scripting support and every command will fail.
- Permission for Raycast to control hora. macOS asks the first time you run a command; if you dismissed it, turn it on under **System Settings › Privacy & Security › Automation › Raycast**.

The extension works with every hora channel — App Store, Setapp and Direct — and finds whichever one you have installed.

## Preferences

- **Default Calendar** — the calendar Quick Add Event writes to. Leave it empty to use the primary calendar of your first connected account.
- **Close Raycast after adding** — dismiss the Raycast window as soon as a quick add is sent.

## How it talks to hora

Everything goes through hora's AppleScript dictionary. Open it in Script Editor (**File › Open Dictionary…**, pick hora Calendar) to see the full vocabulary, or drive it yourself:

```applescript
tell application id "szamowski.Hora"
    parse sentence "lunch with Kuba on Thursday at 1pm" with add immediately
    add task "send the invoice"
    upcoming events limited to 10 with meeting links
end tell
```

Every command answers with JSON.
