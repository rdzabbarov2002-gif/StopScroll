import { useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";

import { useAi } from "../../context/AiContext";
import { useT } from "../../i18n";
import { useThemeColors } from "../../utils/theme";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { Bullet } from "./parts";

/** On the home screen: the two or three most useful lines of the AI analytics. */
export function AiHighlightsCard() {
  const t = useT();
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const { analytics } = useAi();
  if (!analytics) return null;
  const lines = [
    ...analytics.warnings
      .slice(0, 1)
      .map((text) => ({ text, icon: "alert-circle" as const, color: colors.warningStrong })),
    ...analytics.improvements
      .slice(0, 1)
      .map((text) => ({ text, icon: "trending-up" as const, color: colors.success })),
    ...analytics.hypotheses
      .slice(0, 1)
      .map((item) => ({ text: item.text, icon: "bulb" as const, color: colors.warning })),
  ];
  if (!lines.length) return null;
  return (
    <Pressable
      onPress={() => navigation.navigate("Main", { screen: "AI" })}
      accessibilityRole="button"
      accessibilityLabel={t.ai.highlights.a11y}
      className="active:opacity-80"
    >
      <Card className="gap-3">
        <CardLabel icon="sparkles" label={t.ai.highlights.label} color={colors.indigo} chevron />
        {lines.map((line) => (
          <Bullet key={line.text} icon={line.icon} color={line.color} text={line.text} />
        ))}
      </Card>
    </Pressable>
  );
}
