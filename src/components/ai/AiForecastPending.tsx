import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { AppText } from "../AppText";
import { useT } from "../../i18n";
import { useThemeColors } from "../../utils/theme";
import { SyncLine } from "./parts";

/** Until there is any history to forecast from. */
export function AiForecastPending() {
  const t = useT();
  const { colors } = useThemeColors();
  return (
    <Card className="gap-3">
      <CardLabel icon="pulse" label={t.ai.forecast.title} color={colors.textSubtle} />
      <AppText variant="statement">{t.ai.forecast.soon}</AppText>
      <SyncLine />
    </Card>
  );
}
