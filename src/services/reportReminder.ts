import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { WEEKLY_REPORT_HOUR } from "../utils/weeklyReport";

const CHANNEL_ID = "weekly-report";
const REMINDER_ID = "stopscroll-weekly-report";
/** expo-notifications counts weekdays from Sunday = 1. */
const SUNDAY = 1;
export const REPORT_URL = "stopscroll://report";

let handlerSet = false;

/** Shows the reminder as a banner even when it arrives while the app is open. */
function ensureHandler() {
  if (handlerSet) return;
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

async function schedule() {
  ensureHandler();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Недельный отчёт",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Отчёт за неделю готов",
      body: "Сколько времени вы вернули себе, самые трудные часы и новые достижения.",
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
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await schedule();
  return true;
}

/** Keeps the schedule in line with the setting on launch, without ever prompting. */
export async function syncReportReminder(enabled: boolean): Promise<void> {
  if (!enabled) {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
    return;
  }
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) await schedule();
}

/** The report link of the notification that launched the app, if any. */
export function getLaunchNotificationUrl(): string | null {
  const url = Notifications.getLastNotificationResponse()?.notification.request.content.data?.url;
  return typeof url === "string" ? url : null;
}

/** Calls `listener` with the link of every notification the user taps. */
export function subscribeToNotificationUrls(listener: (url: string) => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === "string") listener(url);
  });
  return () => subscription.remove();
}
