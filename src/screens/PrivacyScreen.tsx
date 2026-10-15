import { View } from "react-native";

import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import type { RootStackScreenProps } from "../navigation/types";
import { COACH_VOICE_AVAILABLE } from "../services/coachVoice";

const SECTIONS: readonly { title: string; text: string }[] = [
  {
    title: "Что хранится",
    text: "Время в ленте, победы, срывы и их причины, записи об импульсах, выводы и память коуча, достижения, заметки, свои замены и настройки хранятся только на вашем устройстве. Мы не создаём аккаунт. На сервер уходит только то, что нужно для AI-анализа, и только с вашего разрешения (см. ниже).",
  },
  {
    title: "Персональный коуч",
    text: COACH_VOICE_AVAILABLE
      ? "Закономерности, риск дня и советы коуч находит прямо на устройстве, по вашим записям. Если включены «Живые формулировки», готовые фразы коуча (без заметок, дат и самих записей) отправляются на сервер StopScroll, чтобы звучать естественнее; факты и цифры при этом не меняются. Выключить можно в Настройках."
      : "Закономерности, риск дня и советы коуч находит прямо на устройстве, по вашим записям. Ничего из этого не отправляется на серверы.",
  },
  {
    title: "Виджеты и уведомления",
    text: "Виджеты показывают цифры, которые приложение сохраняет на устройстве. Напоминание об отчёте — локальное уведомление: оно планируется на телефоне и не проходит через наши серверы.",
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
        <AppText variant="title" className="flex-1 text-2xl" accessibilityRole="header">
          Конфиденциальность
        </AppText>
        <IconButton icon="close" onPress={() => navigation.goBack()} accessibilityLabel="Закрыть" />
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
