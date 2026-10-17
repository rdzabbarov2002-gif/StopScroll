import { registerWidgetTaskHandler, type WidgetTaskHandler } from "react-native-android-widget";

import { deviceLanguage, getLanguage, setLanguage } from "../i18n";
import { renderAndroidWidget } from "./AndroidWidgets";
import { widgetLanguage } from "./snapshot";
import { loadWidgetSnapshot } from "./storage";

/**
 * Runs headless when Android asks for a widget: when it is added, resized, or on the
 * 30-minute update period (which also rolls the replacement and the day over).
 */
const widgetTaskHandler: WidgetTaskHandler = async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetAction === "WIDGET_DELETED") return;
  const snapshot = await loadWidgetSnapshot();
  // Without the app nothing has set the language yet, so the widget is drawn in the one saved
  // with the snapshot (the device's before the app has saved any). Drawing is synchronous; the
  // app's own language is put back right after, in case the task runs while the app is open.
  const appLanguage = getLanguage();
  setLanguage(snapshot ? widgetLanguage(snapshot) : (deviceLanguage() ?? "en"));
  try {
    renderWidget(renderAndroidWidget(widgetInfo.widgetName, snapshot, Date.now()));
  } finally {
    setLanguage(appLanguage);
  }
};

registerWidgetTaskHandler(widgetTaskHandler);
