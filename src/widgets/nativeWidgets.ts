import { TurboModuleRegistry } from "react-native";

/**
 * react-native-android-widget throws as soon as it is imported where its native module is
 * missing (Expo Go, a build made before the plugin was added). Everything that touches it is
 * loaded only when the module is really there.
 */
export const hasAndroidWidgets = TurboModuleRegistry.get("AndroidWidget") != null;
