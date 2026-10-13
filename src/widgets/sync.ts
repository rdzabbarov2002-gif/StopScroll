import type { WidgetSnapshot } from "./snapshot";

/** Web has no widgets; iOS and Android override this file. */
export function syncWidgets(_snapshot: WidgetSnapshot): void {}
