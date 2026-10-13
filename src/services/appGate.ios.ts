import { Linking } from "react-native";

import { getGateApp } from "../utils/catalog";
import type { GateApp, GateMode } from "../utils/types";
import { sharedStorage } from "./sharedStorage";

/**
 * iOS has no API that lets a regular app react to another app being opened. The pause is
 * reached through a personal automation in Shortcuts ("When TikTok is opened"): its first step
 * is StopScroll's "Нужна пауза перед лентой?" action (targets/intents), which reads the values
 * below from the App Group, and only when it says yes does the automation open
 * stopscroll://gate. That check is what stops "open anyway" from looping back into the pause.
 */
export const GATE_MODE: GateMode = "shortcuts";

export function syncGateApps(apps: readonly GateApp[]): void {
  sharedStorage.set("gate.apps", apps.join(","));
}

export function allowGateApp(app: GateApp, untilMs: number): void {
  sharedStorage.set(`gate.allowedUntil.${app}`, Math.round(untilMs));
}

/** Opens the app itself, or its site when it isn't installed. */
export async function openGateApp(app: GateApp): Promise<boolean> {
  const info = getGateApp(app);
  try {
    await Linking.openURL(info.scheme);
    return true;
  } catch {
    await Linking.openURL(info.webUrl).catch(() => undefined);
    return false;
  }
}

export const isGateServiceEnabled = () => false;

export function openGateSystemSetup(): void {
  Linking.openURL("shortcuts://").catch(() => undefined);
}
