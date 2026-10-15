import { View } from "react-native";

import { AI_CONFIGURED } from "../ai/client";
import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import type { RootStackScreenProps } from "../navigation/types";

const SECTIONS: readonly { title: string; text: string }[] = [
  {
    title: "Что хранится",
    text: "Время в ленте, победы, срывы и их причины, записи об импульсах, выводы и память коуча, достижения, заметки, свои замены и настройки хранятся только на вашем устройстве. Мы не создаём аккаунт. На сервер уходит только то, что нужно для AI-анализа, и только с вашего разрешения (см. ниже).",
  },
  {
    title: "AI-коуч и ChatGPT",
    text: AI_CONFIGURED
      ? "AI-анализ работает только после вашего явного разрешения. Тогда тексты ваших записей «что произошло перед тем, как захотелось открыть ленту», ответы на вопросы коуча, статистика привычек (время в ленте, срывы, победы, их время и дни недели) и сжатая память коуча отправляются через сервер StopScroll в OpenAI, где их анализирует ChatGPT. Если включены «Живые формулировки», туда же уходят готовые фразы коуча на устройстве. Имя, почта, контакты и данные аккаунтов не передаются; сервер StopScroll ничего не хранит, а запросы к OpenAI отправляются без сохранения ответов (store: false). По правилам OpenAI данные, полученные через API, не используются для обучения моделей и могут храниться ограниченное время для защиты от злоупотреблений. Выключить отправку можно в Настройках → AI-коуч."
      : "В этой сборке AI-анализ не подключён: записи, выводы коуча и статистика остаются только на вашем устройстве. Закономерности, риск дня и советы коуч на устройстве находит сам, без серверов.",
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
    text: "Сбросить прогресс можно в Настройках (это стирает и записи, и данные AI-коуча); отдельно стереть записи и память AI-коуча — в Настройках → AI-коуч. Удаление приложения стирает всё. Управлять подпиской можно в настройках магазина.",
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
