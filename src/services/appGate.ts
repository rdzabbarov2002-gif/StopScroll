import { Linking } from "react-native";

import { getGateApp } from "../utils/catalog";
import type { GateApp, GateMode } from "../utils/types";

/**
 * Web preview: a browser can't see other apps, so the pause is only shown as a preview and
 * "open anyway" opens the site.
 */
export const GATE_MODE: GateMode = "preview";

export function syncGateApps(_apps: readonly GateApp[]): void {}

export function allowGateApp(_app: GateApp, _untilMs: number): void {}

export async function openGateApp(app: GateApp): Promise<boolean> {
  await Linking.openURL(getGateApp(app).webUrl).catch(() => undefined);
  return false;
}

export const isGateServiceEnabled = () => false;

export function openGateSystemSetup(): void {}
