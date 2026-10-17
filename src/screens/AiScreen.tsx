import Ionicons from "@expo/vector-icons/Ionicons";
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
import { useT } from "../i18n";
import type { RootTabScreenProps } from "../navigation/types";
import { addDays, dayKey } from "../utils/date";
import { DEMO_MODE } from "../utils/demo";
import { useThemeColors } from "../utils/theme";
import { useNow } from "../utils/useNow";

/**
 * The AI tab: not a chat — a ready analysis of the user's behavior: today's forecast, patterns,
 * changes, hypotheses, the weekly experiment. ChatGPT's long-term memory supplies the
 * conclusions; the numbers are counted on the device and are always current.
 */
export function AiScreen(_props: RootTabScreenProps<"AI">) {
  const t = useT();
  const ai = useAi();
  const now = useNow(60_000);

  return (
    <Screen>
      <View className="gap-1 px-1 pb-1 pt-3">
        <AppText variant="overline" tone="subtle">
          {t.ai.screen.overline}
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {t.ai.screen.title}
        </AppText>
        {ai.enabled ? (
          <View className="pt-1">
            <SyncLine />
          </View>
        ) : null}
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

      <EntryHistory entries={ai.entries} now={now} />
    </Screen>
  );
}

function Connected({ now }: { now: number }) {
  const t = useT();
  const s = t.ai.screen;
  const { colors } = useThemeColors();
  const ai = useAi();
  const forecast = ai.forecast?.day === dayKey(now) ? ai.forecast : null;
  // The last finished experiment's review stays visible for two weeks, even after a new proposal.
  const lastReview =
    ai.challenge?.status === "done"
      ? null
      : (ai.pastChallenges.find(
          (item) =>
            item.status === "done" &&
            item.review &&
            item.endDay !== null &&
            item.endDay >= addDays(dayKey(now), -14),
        ) ?? null);
  return (
    <>
      {ai.question ? <QuestionCard question={ai.question} /> : null}
      {forecast ? <AiForecastCard forecast={forecast} /> : null}
      {ai.challenge && ai.challenge.status !== "declined" ? (
        <ChallengeCard challenge={ai.challenge} />
      ) : null}
      {lastReview ? <ChallengeCard challenge={lastReview} readOnly /> : null}
      {ai.analytics ? (
        <AnalyticsView analytics={ai.analytics} />
      ) : (
        <Card className="gap-2">
          <CardLabel icon="hourglass" label={s.preparing} color={colors.indigo} />
          <AppText variant="statement">
            {ai.entries.length === 0 ? s.startEntry : s.studying}
          </AppText>
          <AppText variant="caption" tone="muted" className="leading-[20px]">
            {s.moreEntries}
          </AppText>
        </Card>
      )}
    </>
  );
}

function NotConnected() {
  const t = useT();
  const s = t.ai.screen;
  const { colors } = useThemeColors();
  return (
    <Card className="gap-2">
      <CardLabel icon="cloud-offline" label={s.notConnected} color={colors.textSubtle} />
      <AppText variant="statement">{s.notConnectedTitle}</AppText>
      <AppText variant="caption" tone="muted" className="leading-[20px]">
        {s.notConnectedText}
      </AppText>
    </Card>
  );
}

/** Web preview without a server: the screen's design on sample content, clearly labeled. */
function DemoPreview({ now }: { now: number }) {
  const t = useT();
  const { colors } = useThemeColors();
  // Rebuilt on every render: cheap, and it follows the app's language.
  const sample = demoSample(now);
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
          {t.ai.screen.demoNote}
        </AppText>
      </View>
      <AiForecastCard forecast={sample.forecast} />
      <ChallengeCard challenge={sample.challenge} readOnly />
      <AnalyticsView analytics={sample.analytics} />
    </>
  );
}
