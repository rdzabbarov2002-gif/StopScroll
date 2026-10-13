import { reloadWidgets, sharedStorage } from "../services/sharedStorage";
import type { WidgetSnapshot } from "./snapshot";

/** Hands the numbers to the WidgetKit extension through the App Group and refreshes it. */
export function syncWidgets(snapshot: WidgetSnapshot): void {
  sharedStorage.set("widget.snapshot", JSON.stringify(snapshot));
  reloadWidgets();
}
