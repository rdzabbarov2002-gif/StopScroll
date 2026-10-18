import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

import { m } from "../i18n";
import { WEEKLY_REPORT_HOUR } from "../utils/weeklyReport";

const CHANNEL_ID = "weekly-report";
const REMINDER_ID = "stopscroll-weekly-report";
/** expo-notifications counts weekdays from Sunday = 1. */
const SUNDAY = 1;
export const REPORT_URL = "stopscroll://report";

/**
 * Expo Go on Android has no notifications since SDK 53: even importing the library throws there.
 * The reminder works in a development or store build (and in Expo Go on iOS).
 */
const Notifications: typeof import("expo-notifications") | null =
  Platform.OS === "android" && isRunningInExpoGo()
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("expo-notifications");

let handlerSet = false;

/** Shows the reminder as a banner even when it arrives while the app is open. */
function ensureHandler() {
  if (handlerSet || !Notifications) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Schedules the reminder with the texts of the current language (rescheduled when it changes). */
async function schedule() {
  if (!Notifications) return;
  ensureHandler();
  const texts = m().report.reminder;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: texts.channel,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: texts.title,
      body: texts.body,
      data: { url: REPORT_URL },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: SUNDAY,
      hour: WEEKLY_REPORT_HOUR,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
}

/** Asks for permission if needed; false when the user said no. */
export async function enableReportReminder(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await schedule();
  return true;
}

/** Keeps the schedule in line with the setting on launch, without ever prompting. */
export async function syncReportReminder(enabled: boolean): Promise<void> {
  if (!Notifications) return;
  if (!enabled) {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
    return;
  }
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) await schedule();
}

/** The report link of the notification that launched the app, if any. */
export function getLaunchNotificationUrl(): string | null {
  if (!Notifications) return null;
  try {
    const url =
      Notifications.getLastNotificationResponse()?.notification?.request?.content?.data?.url;
    return typeof url === "string" ? url : null;
  } catch {
    // Not available in this runtime (e.g. Expo Go without the module): no launch link.
    return null;
  }
}

/** Calls `listener` with the link of every notification the user taps. */
export function subscribeToNotificationUrls(listener: (url: string) => void): () => void {
  if (!Notifications) return () => {};
  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response?.notification?.request?.content?.data?.url;
      if (typeof url === "string") listener(url);
    });
    return () => subscription.remove();
  } catch {
    return () => {};
  }
}
