import { View } from "react-native";

import { useAi } from "../../context/AiContext";
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
  const { colors } = useThemeColors();
  const ai = useAi();
  const declined = ai.consent === false;
  return (
    <Card tone="primary" className="gap-3">
      <CardLabel icon="lock-closed" label="Ваше разрешение" color={colors.primary} />
      <AppText variant="statement">
        {declined
          ? "AI-анализ выключен — записи остаются только на телефоне."
          : "Чтобы AI-коуч изучал ваши привычки, нужно разрешение"}
      </AppText>
      <AppText tone="muted" className="text-[15px] leading-[21px]">
        Ваши записи, ответы на вопросы и статистика привычек (время в ленте, срывы, победы — без
        имени, почты и контактов) будут отправляться через сервер StopScroll в OpenAI, где их
        анализирует ChatGPT. По правилам OpenAI данные, отправленные через API, не используются для
        обучения моделей. Память коуча и история хранятся только на вашем телефоне. Выключить можно
        в любой момент в Настройках.
      </AppText>
      <View className="gap-2 pt-1">
        <Button label="Разрешить анализ" size="lg" onPress={() => ai.setConsent(true)} />
        {!declined ? (
          <Button label="Не сейчас" variant="ghost" onPress={() => ai.setConsent(false)} />
        ) : null}
      </View>
    </Card>
  );
}
