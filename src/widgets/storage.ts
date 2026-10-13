import AsyncStorage from "@react-native-async-storage/async-storage";

import { dayKey } from "../utils/date";
import { loadPersistedState } from "../utils/storage";
import { buildWidgetSnapshot, type WidgetSnapshot } from "./snapshot";

/** Where the app leaves the widget numbers for the Android widget task (a headless JS task). */
const WIDGET_STORAGE_KEY = "@stopscroll/widget/v1";

export async function saveWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(snapshot));
}

const isSnapshot = (value: unknown): value is WidgetSnapshot =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as WidgetSnapshot).day === "string" &&
  Array.isArray((value as WidgetSnapshot).replacements);

/**
 * The latest numbers from the app. Before the app has written any (e.g. right after an
 * update), they are built from the saved history with the free catalog.
 */
export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  const json = await AsyncStorage.getItem(WIDGET_STORAGE_KEY).catch(() => null);
  if (json) {
    try {
      const parsed: unknown = JSON.parse(json);
      if (isSnapshot(parsed)) return parsed;
    } catch {
      // Fall through to the saved history.
    }
  }
  const state = await loadPersistedState().catch(() => null);
  if (!state?.onboarded) return null;
  return buildWidgetSnapshot({ ...state, todayKey: dayKey() }, false);
}
