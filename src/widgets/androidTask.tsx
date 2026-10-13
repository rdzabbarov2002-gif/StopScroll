import { registerWidgetTaskHandler, type WidgetTaskHandler } from "react-native-android-widget";

import { renderAndroidWidget } from "./AndroidWidgets";
import { loadWidgetSnapshot } from "./storage";

/**
 * Runs headless when Android asks for a widget: when it is added, resized, or on the
 * 30-minute update period (which also rolls the replacement and the day over).
 */
const widgetTaskHandler: WidgetTaskHandler = async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetAction === "WIDGET_DELETED") return;
  const snapshot = await loadWidgetSnapshot();
  renderWidget(renderAndroidWidget(widgetInfo.widgetName, snapshot, Date.now()));
};

registerWidgetTaskHandler(widgetTaskHandler);
