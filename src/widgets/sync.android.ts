import { hasAndroidWidgets } from "./nativeWidgets";
import type { WidgetSnapshot } from "./snapshot";
import { saveWidgetSnapshot } from "./storage";

// A conditional require, so the library is never evaluated without its module (nativeWidgets.ts).
const widgets: typeof import("./androidRedraw") | null = hasAndroidWidgets
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./androidRedraw")
  : null;

/** Saves the numbers for the widget task and redraws every widget on the home screen. */
export function syncWidgets(snapshot: WidgetSnapshot): void {
  saveWidgetSnapshot(snapshot).catch((error: unknown) =>
    console.warn("StopScroll: could not save widget data", error),
  );
  widgets?.redrawAndroidWidgets(snapshot);
}
