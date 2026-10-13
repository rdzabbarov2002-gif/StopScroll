// Browsers get no scheduled notifications in the web preview.
export const REPORT_URL = "stopscroll://report";

export async function enableReportReminder(): Promise<boolean> {
  return false;
}

export async function syncReportReminder(_enabled: boolean): Promise<void> {}

export function getLaunchNotificationUrl(): string | null {
  return null;
}

export function subscribeToNotificationUrls(_listener: (url: string) => void): () => void {
  return () => {};
}
