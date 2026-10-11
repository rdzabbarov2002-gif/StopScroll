import { View } from "react-native";

import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import type { RootStackScreenProps } from "../navigation/types";

const SECTIONS: readonly { title: string; text: string }[] = [
  {
    title: "Что хранится",
    text: "Время в ленте, победы, срывы, заметки, свои замены и настройки хранятся только на вашем устройстве. Мы не создаём аккаунт и не отправляем эти данные на свои серверы.",
  },
  {
    title: "Покупки",
    text: "Подписку оформляет App Store или Google Play. Статус подписки проверяет сервис RevenueCat по анонимному идентификатору приложения — без имени, почты и содержимого дневника.",
  },
  {
    title: "Реклама и трекинг",
    text: "В приложении нет рекламы и сторонней аналитики, мы не отслеживаем вас в других приложениях и на сайтах.",
  },
  {
    title: "Удаление данных",
    text: "Сбросить прогресс можно в Настройках; удаление приложения стирает все записи. Управлять подпиской можно в настройках магазина.",
  },
];

export function PrivacyScreen({ navigation }: RootStackScreenProps<"Privacy">) {
  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <IconButton
          icon="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Назад"
        />
        <AppText variant="title" className="flex-1 text-2xl" accessibilityRole="header">
          Конфиденциальность
        </AppText>
      </View>
      {SECTIONS.map((section) => (
        <Card key={section.title} className="gap-2">
          <AppText variant="heading">{section.title}</AppText>
          <AppText tone="muted">{section.text}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
