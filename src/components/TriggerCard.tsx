import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { getTrigger } from "../utils/catalog";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import type { TriggerId } from "../utils/types";
import { AppText } from "./AppText";
import { TRIGGER_TONES } from "./triggerTones";

interface TriggerCardProps {
  id: TriggerId;
  onPress: () => void;
}

/** Quick "how do I feel" card on the home screen; starts the SOS pause for that state. */
export function TriggerCard({ id, onPress }: TriggerCardProps) {
  const { isDark } = useThemeColors();
  const trigger = getTrigger(id);
  const tone = TRIGGER_TONES[trigger.tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trigger.label}: ${trigger.hint}. Начать паузу`}
      className={cn("flex-1 gap-3 rounded-3xl border p-3.5 active:opacity-80", tone.card)}
    >
      <View className={cn("h-11 w-11 items-center justify-center rounded-2xl", tone.iconBg)}>
        <Ionicons name={trigger.icon} size={22} color={isDark ? tone.icon.dark : tone.icon.light} />
      </View>
      <View className="gap-0.5">
        <AppText
          variant="label"
          className="text-[15px]"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {trigger.label}
        </AppText>
        <AppText variant="caption" tone="muted" className="text-xs leading-4" numberOfLines={2}>
          {trigger.hint}
        </AppText>
      </View>
    </Pressable>
  );
}
