import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { View } from "react-native";

import { demoSample } from "../ai/demoSample";
import { AiForecastCard } from "../components/ai/AiForecastCard";
import { AnalyticsView } from "../components/ai/AnalyticsView";
import { ChallengeCard } from "../components/ai/ChallengeCard";
import { ConsentCard } from "../components/ai/ConsentCard";
import { EntryHistory } from "../components/ai/EntryHistory";
import { QuestionCard } from "../components/ai/QuestionCard";
import { SyncLine } from "../components/ai/parts";
import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { CardLabel } from "../components/CardLabel";
import { Screen } from "../components/Screen";
import { useAi } from "../context/AiContext";
import type { RootTabScreenProps } from "../navigation/types";
import { dayKey } from "../utils/date";
import { DEMO_MODE } from "../utils/demo";
import { useThemeColors } from "../utils/theme";
import { useNow } from "../utils/useNow";

/**
 * The AI tab: not a chat — a ready analysis of the user's behavior, recalculated by ChatGPT
 * after every new entry: today's forecast, patterns, changes, hypotheses, the weekly experiment.
 */
export function AiScreen(_props: RootTabScreenProps<"AI">) {
  const ai = useAi();
  const now = useNow(60_000);

  return (
    <Screen>
      <View className="gap-1 px-1 pb-1 pt-3">
        <AppText variant="overline" tone="subtle">
          Персональная аналитика
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          AI-коуч
        </AppText>
        <View className="pt-1">
          <SyncLine />
        </View>
      </View>

      {!ai.configured ? (
        DEMO_MODE ? (
          <DemoPreview now={now} />
        ) : (
          <NotConnected />
        )
      ) : ai.consent !== true ? (
        <ConsentCard />
      ) : (
        <Connected now={now} />
      )}

      {ai.configured ? <EntryHistory entries={ai.entries} now={now} /> : null}
    </Screen>
  );
}

function Connected({ now }: { now: number }) {
  const { colors } = useThemeColors();
  const ai = useAi();
  const forecast = ai.forecast?.day === dayKey(now) ? ai.forecast : null;
  return (
    <>
      {ai.question ? <QuestionCard question={ai.question} /> : null}
      {forecast ? <AiForecastCard forecast={forecast} /> : null}
      {ai.challenge && ai.challenge.status !== "declined" ? (
        <ChallengeCard challenge={ai.challenge} />
      ) : null}
      {ai.analytics ? (
        <AnalyticsView analytics={ai.analytics} memory={ai.memory} />
      ) : (
        <Card className="gap-2">
          <CardLabel icon="hourglass" label="Анализ готовится" color={colors.indigo} />
          <AppText variant="statement">
            {ai.entries.length === 0
              ? "Начните с записи на главной: что произошло перед тем, как захотелось открыть ленту."
              : "ChatGPT изучает вашу историю — первые выводы появятся здесь сами."}
          </AppText>
          <AppText variant="caption" tone="muted" className="leading-[20px]">
            Чем больше записей, тем точнее закономерности и прогнозы. Ничего запускать вручную не
            нужно.
          </AppText>
        </Card>
      )}
    </>
  );
}

function NotConnected() {
  const { colors } = useThemeColors();
  return (
    <Card className="gap-2">
      <CardLabel icon="cloud-offline" label="Не подключено" color={colors.textSubtle} />
      <AppText variant="statement">AI-анализ в этой сборке не подключён.</AppText>
      <AppText variant="caption" tone="muted" className="leading-[20px]">
        Записи сохраняются на телефоне. Когда приложение подключат к серверу AI-коуча, ChatGPT
        разберёт всю накопленную историю.
      </AppText>
    </Card>
  );
}

/** Web preview without a server: the screen's design on sample content, clearly labeled. */
function DemoPreview({ now }: { now: number }) {
  const { colors } = useThemeColors();
  const sample = useMemo(() => demoSample(now), [now]);
  return (
    <>
      <View className="flex-row items-start gap-3 rounded-card bg-amber-50 p-4 dark:bg-amber-950">
        <Ionicons
          name="eye-outline"
          size={20}
          color={colors.warningStrong}
          style={{ marginTop: 1 }}
        />
        <AppText variant="caption" className="flex-1 leading-[20px]">
          Это пример экрана. В веб-демо ChatGPT не подключён, поэтому тексты ниже — образец, а не
          анализ ваших данных. В приложении их строит ChatGPT по вашей истории.
        </AppText>
      </View>
      <AiForecastCard forecast={sample.forecast} />
      <ChallengeCard challenge={sample.challenge} readOnly />
      <AnalyticsView analytics={sample.analytics} memory={sample.memory} />
    </>
  );
}
