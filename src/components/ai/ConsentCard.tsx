import { View } from "react-native";

import { useAi } from "../../context/AiContext";
import { useT } from "../../i18n";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";

/**
 * Explicit permission before anything is sent to ChatGPT (App Store guideline 5.1.2(i),
 * GDPR): what is sent, to whom, and that it can be turned off.
 */
export function ConsentCard() {
  const t = useT();
  const { colors } = useThemeColors();
  const ai = useAi();
  const declined = ai.consent === false;
  return (
    <Card tone="primary" className="gap-3">
      <CardLabel icon="lock-closed" label={t.ai.consent.label} color={colors.primary} />
      <AppText variant="statement">{declined ? t.ai.consent.declined : t.ai.consent.ask}</AppText>
      <AppText tone="muted" className="text-[15px] leading-[21px]">
        {t.ai.consent.text}
      </AppText>
      <View className="gap-2 pt-1">
        <Button label={t.ai.consent.allow} size="lg" onPress={() => ai.setConsent(true)} />
        {!declined ? (
          <Button
            label={t.ai.consent.notNow}
            variant="ghost"
            onPress={() => ai.setConsent(false)}
          />
        ) : null}
      </View>
    </Card>
  );
}
