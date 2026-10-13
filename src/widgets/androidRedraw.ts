import { requestWidgetUpdate } from "react-native-android-widget";

import { ANDROID_WIDGETS, renderAndroidWidget } from "./AndroidWidgets";
import type { WidgetSnapshot } from "./snapshot";

/** Redraws every StopScroll widget on the home screen with fresh numbers. */
export function redrawAndroidWidgets(snapshot: WidgetSnapshot): void {
  for (const widgetName of ANDROID_WIDGETS) {
    requestWidgetUpdate({
      widgetName,
      renderWidget: () => renderAndroidWidget(widgetName, snapshot, Date.now()),
    }).catch(() => undefined);
  }
}
