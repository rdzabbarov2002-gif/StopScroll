import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { AppText } from "../AppText";
import { useThemeColors } from "../../utils/theme";
import { SyncLine } from "./parts";

/** While ChatGPT prepares today's forecast (e.g. the first open of the day). */
export function AiForecastPending() {
  const { colors } = useThemeColors();
  return (
    <Card className="gap-3">
      <CardLabel icon="pulse" label="Прогноз на сегодня" color={colors.textSubtle} />
      <AppText variant="statement">Прогноз на сегодня скоро появится.</AppText>
      <SyncLine />
    </Card>
  );
}
