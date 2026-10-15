import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import type { EntryAnalysis } from "../../ai/types";
import { useThemeColors } from "../../utils/theme";
import type { IconName } from "../../utils/types";
import { AppText } from "../AppText";

/** ChatGPT's reading of one entry: cause, state, situation, behavior and why. */
export function EntryAnalysisView({ analysis }: { analysis: EntryAnalysis }) {
  const { colors } = useThemeColors();
  const rows: [string, string | null, IconName][] = [
    ["Причина", analysis.cause, "help-circle-outline"],
    ["Состояние", analysis.emotion, "heart-outline"],
    ["Ситуация", analysis.context, "location-outline"],
    ["Тип поведения", analysis.behavior, "repeat-outline"],
  ];
  const known = rows.filter((row): row is [string, string, IconName] => row[1] !== null);

  return (
    <View className="gap-2.5">
      {known.map(([label, value, icon]) => (
        <View key={label} className="flex-row items-start gap-2.5">
          <Ionicons name={icon} size={17} color={colors.indigo} style={{ marginTop: 1 }} />
          <AppText className="flex-1 text-[15px] leading-[21px]">
            <AppText className="text-[15px] font-semibold leading-[21px]">{label}: </AppText>
            {value}
          </AppText>
        </View>
      ))}
      <AppText variant="caption" tone="muted" className="leading-[21px]">
        {analysis.explanation}
      </AppText>
      {!analysis.enough ? (
        <View className="flex-row items-start gap-2.5 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950">
          <Ionicons name="information-circle" size={18} color={colors.warningStrong} />
          <AppText variant="caption" className="flex-1 leading-[20px]">
            Информации пока недостаточно для уверенного вывода
            {analysis.missing ? `: ${analysis.missing}` : "."}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
