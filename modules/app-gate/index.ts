import { requireOptionalNativeModule } from "expo";

/** The Android pause service (an accessibility service in this local module). */
interface AppGateNative {
  isServiceEnabled(): boolean;
  openServiceSettings(): void;
  /** Package name → StopScroll app id. */
  setWatchedApps(packages: Record<string, string>): void;
  allowApp(app: string, untilMs: number): void;
  /** Launches the first installed package; false when none is installed. */
  openApp(packages: string[]): boolean;
}

/** Null where the native module isn't built in (web, iOS, Expo Go). */
export const AppGate = requireOptionalNativeModule<AppGateNative>("AppGate");
