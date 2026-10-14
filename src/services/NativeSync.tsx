import { useEffect, useMemo } from "react";

import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import { buildWidgetSnapshot } from "../widgets/snapshot";
import { syncWidgets } from "../widgets/sync";
import { syncReportReminder } from "./reportReminder";

/** Wait for a burst of changes to settle before redrawing widgets. */
const WIDGET_DEBOUNCE_MS = 400;

/** Keeps what lives outside the JS app in step with the state: the Sunday reminder and widgets. */
export function NativeSync() {
  const app = useApp();
  const { isPro } = usePro();

  const { reportReminder } = app.settings;
  useEffect(() => {
    syncReportReminder(reportReminder).catch((error: unknown) =>
      console.warn("StopScroll: could not update the weekly reminder", error),
    );
  }, [reportReminder]);

  // Widgets only redraw when one of their numbers actually changed.
  const snapshot = useMemo(
    () =>
      JSON.stringify(
        buildWidgetSnapshot(
          {
            todayKey: app.todayKey,
            wins: app.wins,
            winArchive: app.winArchive,
            scrollLog: app.scrollLog,
            settings: app.settings,
            customReplacements: app.customReplacements,
          },
          isPro,
        ),
      ),
    [
      app.todayKey,
      app.wins,
      app.winArchive,
      app.scrollLog,
      app.settings,
      app.customReplacements,
      isPro,
    ],
  );
  useEffect(() => {
    const timer = setTimeout(() => syncWidgets(JSON.parse(snapshot)), WIDGET_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [snapshot]);

  return null;
}
