import { open, showToast, Toast } from "@raycast/api";
import { HoraNotAuthorizedError, HoraNotInstalledError } from "./hora";

/**
 * One place that turns a thrown error into a toast, so every command explains
 * the two failures a person can actually do something about — hora missing,
 * and macOS not letting Raycast talk to it — instead of showing raw
 * osascript output.
 */
export async function showFailure(error: unknown, title = "Something went wrong") {
  if (error instanceof HoraNotInstalledError) {
    await showToast({
      style: Toast.Style.Failure,
      title: "hora Calendar is not installed",
      message: "Install hora to use this extension.",
      primaryAction: {
        title: "Open horacal.app",
        onAction: () => {
          open("https://horacal.app");
        },
      },
    });
    return;
  }

  if (error instanceof HoraNotAuthorizedError) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Raycast cannot control hora",
      message: "Allow it under System Settings › Privacy & Security › Automation.",
      primaryAction: {
        title: "Open Automation Settings",
        onAction: () => {
          open("x-apple.systempreferences:com.apple.preference.security?Privacy_Automation");
        },
      },
    });
    return;
  }

  await showToast({
    style: Toast.Style.Failure,
    title,
    message: error instanceof Error ? error.message : String(error),
  });
}
