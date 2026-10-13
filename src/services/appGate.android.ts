import { Linking } from "react-native";

import { AppGate } from "../../modules/app-gate";
import { GATE_APPS, getGateApp } from "../utils/catalog";
import type { GateApp, GateMode } from "../utils/types";

/**
 * On Android an accessibility service (modules/app-gate) notices a watched app coming to the
 * screen and opens stopscroll://gate in front of it. The user turns it on in the system
 * accessibility settings; until then nothing is intercepted.
 */
export const GATE_MODE: GateMode = "service";

export function syncGateApps(apps: readonly GateApp[]): void {
  const packages: Record<string, string> = {};
  for (const app of GATE_APPS) {
    if (!apps.includes(app.id)) continue;
    for (const pkg of app.packages) packages[pkg] = app.id;
  }
  AppGate?.setWatchedApps(packages);
}

export function allowGateApp(app: GateApp, untilMs: number): void {
  AppGate?.allowApp(app, Math.round(untilMs));
}

/** Launches the installed app, or opens its site when it isn't installed. */
export async function openGateApp(app: GateApp): Promise<boolean> {
  const info = getGateApp(app);
  if (AppGate?.openApp([...info.packages])) return true;
  await Linking.openURL(info.webUrl).catch(() => undefined);
  return false;
}

export const isGateServiceEnabled = () => AppGate?.isServiceEnabled() ?? false;

export function openGateSystemSetup(): void {
  AppGate?.openServiceSettings();
}
