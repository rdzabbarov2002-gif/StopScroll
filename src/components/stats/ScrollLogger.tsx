import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { useApp } from "../../context/AppContext";
import { MAX_SCROLL_MINUTES, SCROLL_PRESETS } from "../../utils/catalog";
import { cn } from "../../utils/cn";
import { addDays, formatMinutes } from "../../utils/date";
import { haptics } from "../../utils/haptics";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { SegmentedControl } from "../SegmentedControl";

const SLIDER_MAX = 480;
const STEP = 5;

type Day = "today" | "yesterday";

/** Daily scroll-time input: slider, fine ±5 min steps and quick presets. */
export function ScrollLogger() {
  const { todayKey, scrollLog } = useApp();
  const [day, setDay] = useState<Day>("today");
  const key = day === "today" ? todayKey : addDays(todayKey, -1);
  const logged = scrollLog[key];

  return (
    <Card className="gap-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <AppText variant="heading">Время в ленте</AppText>
          <AppText variant="caption" tone="muted">
            Reels, TikTok, Shorts — всё вместе
          </AppText>
        </View>
      </View>
      <SegmentedControl
        options={[
          { value: "today", label: "Сегодня" },
          { value: "yesterday", label: "Вчера" },
        ]}
        value={day}
        onChange={setDay}
      />
      {/* Remount per day so the draft starts from what is stored for that day. */}
      <LoggerBody key={key} dayKey={key} logged={logged} />
    </Card>
  );
}

function LoggerBody({ dayKey, logged }: { dayKey: string; logged: number | undefined }) {
  const { colors } = useThemeColors();
  const { logScroll, settings } = useApp();
  const [value, setValue] = useState(logged ?? 0);
  const limit = settings.dailyLimitMinutes;
  const over = value > limit;
  const dirty = logged === undefined || value !== logged;

  const update = (next: number) => {
    setValue(Math.max(0, Math.min(MAX_SCROLL_MINUTES, Math.round(next / STEP) * STEP)));
  };

  return (
    <View className="gap-4">
      <View className="items-center gap-2">
        <AppText variant="display" className="text-5xl" accessibilityLiveRegion="polite">
          {formatMinutes(value)}
        </AppText>
        <View
          className={cn(
            "flex-row items-center gap-1.5 rounded-full px-3 py-1",
            over ? "bg-amber-100 dark:bg-amber-950/50" : "bg-emerald-100 dark:bg-emerald-950/50",
          )}
        >
          <Ionicons
            name={over ? "alert-circle-outline" : "checkmark-circle-outline"}
            size={14}
            color={over ? colors.warningStrong : colors.success}
          />
          <AppText
            variant="caption"
            className={cn(
              "font-semibold",
              over
                ? "text-amber-700 dark:text-amber-300"
                : "text-emerald-700 dark:text-emerald-300",
            )}
          >
            {over
              ? `Выше лимита на ${formatMinutes(value - limit)}`
              : `В пределах лимита ${formatMinutes(limit)}`}
          </AppText>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <RoundButton icon="remove" label="Минус 5 минут" onPress={() => update(value - STEP)} />
        <View className="flex-1">
          <Slider
            value={Math.min(value, SLIDER_MAX)}
            minimumValue={0}
            maximumValue={SLIDER_MAX}
            step={STEP}
            onValueChange={update}
            onSlidingComplete={() => haptics.selection()}
            minimumTrackTintColor={over ? colors.warning : colors.primary}
            maximumTrackTintColor={colors.ringTrack}
            thumbTintColor={over ? colors.warningStrong : colors.primaryStrong}
            accessibilityLabel="Минут в ленте за день"
            style={{ height: 40 }}
          />
        </View>
        <RoundButton icon="add" label="Плюс 5 минут" onPress={() => update(value + STEP)} />
      </View>

      <View className="flex-row gap-2">
        {SCROLL_PRESETS.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => {
              haptics.selection();
              update(preset);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Установить ${formatMinutes(preset)}`}
            className={cn(
              "h-9 flex-1 items-center justify-center rounded-xl border active:opacity-70",
              value === preset
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/50"
                : "border-slate-200 dark:border-ink-700",
            )}
          >
            <AppText variant="label" className="text-[13px]">
              {formatMinutes(preset)}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Button
        label={!dirty ? "Записано" : logged === undefined ? "Записать" : "Обновить запись"}
        icon={!dirty ? "checkmark-circle" : "save-outline"}
        disabled={!dirty}
        onPress={() => {
          logScroll(dayKey, value);
          haptics.success();
        }}
      />
      <AppText variant="caption" tone="subtle" className="text-center text-xs">
        Точное время подскажет «Экранное время» на iOS или «Цифровое благополучие» на Android.
      </AppText>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: "add" | "remove";
  label: string;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-70 dark:bg-ink-800"
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}
