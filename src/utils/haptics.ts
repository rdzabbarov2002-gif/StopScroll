import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const enabled = Platform.OS === "ios" || Platform.OS === "android";

// Haptics are a nice-to-have: failures (simulators, unsupported devices) are ignored.
export const haptics = {
  selection() {
    if (enabled) Haptics.selectionAsync().catch(() => undefined);
  },
  light() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  success() {
    if (enabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
};
