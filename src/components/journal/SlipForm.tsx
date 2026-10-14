import { useState } from "react";
import { View } from "react-native";

import { useApp } from "../../context/AppContext";
import { FEED_APPS } from "../../utils/catalog";
import { formatMinutes } from "../../utils/date";
import { haptics } from "../../utils/haptics";
import { useThemeColors } from "../../utils/theme";
import type { FeedApp, SlipEntry } from "../../utils/types";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { Chip } from "../Chip";

const MINUTE_OPTIONS = [5, 15, 30, 60, 120] as const;

interface SlipFormProps {
  /** Called with the saved slip, so the coach can ask what happened. */
  onSaved: (entry: SlipEntry) => void;
}

/** Quick capture of a slip: where and how long. Why it happened, the coach asks next. */
export function SlipForm({ onSaved }: SlipFormProps) {
  const { colors } = useThemeColors();
  const { logSlip, settings } = useApp();
  // null = follow the "main feed" setting until the user picks an app here.
  const [pickedApp, setApp] = useState<FeedApp | null>(null);
  const app = pickedApp ?? settings.mainApp;
  const [minutes, setMinutes] = useState<number>(15);

  const save = () => {
    const entry = logSlip({ trigger: null, app, minutesLost: minutes, note: "" });
    haptics.success();
    setApp(null);
    onSaved(entry);
  };

  return (
    <Card className="gap-5">
      <View className="gap-2">
        <CardLabel icon="add-circle" label="Записать срыв" color={colors.warningStrong} />
        <AppText variant="statement">Лента победила? Это бывает.</AppText>
      </View>

      <View className="gap-3">
        <AppText variant="overline" tone="subtle">
          Где
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          {FEED_APPS.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              icon={item.icon}
              selected={app === item.id}
              onPress={() => {
                haptics.selection();
                setApp(item.id);
              }}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <AppText variant="overline" tone="subtle">
          Сколько ушло
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          {MINUTE_OPTIONS.map((value) => (
            <Chip
              key={value}
              label={formatMinutes(value)}
              selected={minutes === value}
              onPress={() => {
                haptics.selection();
                setMinutes(value);
              }}
            />
          ))}
        </View>
      </View>

      <Button label="Записать срыв" icon="add-circle-outline" size="lg" onPress={save} />
    </Card>
  );
}
