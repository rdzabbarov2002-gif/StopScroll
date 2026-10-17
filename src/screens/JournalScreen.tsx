import { useMemo, useState } from "react";
import { View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { ReflectionSheet } from "../components/coach/ReflectionSheet";
import { EmptyState } from "../components/EmptyState";
import { DeepAnalytics } from "../components/journal/DeepAnalytics";
import { PatternsCard } from "../components/journal/PatternsCard";
import { SlipForm } from "../components/journal/SlipForm";
import { SlipHistoryItem } from "../components/journal/SlipHistoryItem";
import { LockedCard } from "../components/LockedCard";
import { ProBadge } from "../components/ProBadge";
import { ListGroup } from "../components/ListGroup";
import { Screen } from "../components/Screen";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import { useT } from "../i18n";
import type { RootTabScreenProps } from "../navigation/types";
import { computePatterns } from "../utils/analytics";
import type { SlipEntry, TriggerId } from "../utils/types";
import { useNow } from "../utils/useNow";

const PAGE_SIZE = 15;

export function JournalScreen({ route }: RootTabScreenProps<"Journal">) {
  const t = useT().journal;
  const { slips, wins, deleteSlip } = useApp();
  const { isPro } = usePro();
  const now = useNow(60_000);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // The slip the coach is asking about, and the reason already known from the SOS screen.
  const [reflecting, setReflecting] = useState<{ slip: SlipEntry; trigger?: TriggerId } | null>(
    null,
  );
  // A hand-over from the SOS screen brings a reason for the next slip only.
  const handoffAt = route.params?.handoffAt;
  const [usedHandoff, setUsedHandoff] = useState<number | undefined>(undefined);
  const prefill = handoffAt !== usedHandoff ? route.params?.trigger : undefined;

  const patterns = useMemo(() => computePatterns(slips, wins, now), [slips, wins, now]);
  const visible = slips.slice(0, visibleCount);

  return (
    <Screen>
      <View className="gap-1 px-1 pb-1 pt-3">
        <AppText variant="title" accessibilityRole="header">
          {t.title}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t.intro}
        </AppText>
      </View>

      <SlipForm
        onSaved={(slip) => {
          setReflecting({ slip, trigger: prefill });
          setUsedHandoff(handoffAt);
        }}
      />

      <PatternsCard patterns={patterns} />

      <View className="gap-3">
        <View className="flex-row items-center gap-2 px-1 pt-2">
          <AppText variant="overline" tone="subtle" accessibilityRole="header">
            {t.deepAnalytics}
          </AppText>
          {!isPro ? <ProBadge /> : null}
        </View>
        {isPro ? (
          <DeepAnalytics patterns={patterns} />
        ) : (
          <LockedCard feature="analytics" title={t.locked.title} text={t.locked.text} />
        )}
      </View>

      {slips.length === 0 ? (
        <EmptyState icon="journal-outline" title={t.empty.title} text={t.empty.text} />
      ) : (
        <View className="gap-3">
          <ListGroup
            header={t.history}
            headerRight={
              <AppText variant="caption" tone="subtle" className="text-[13px]">
                {t.entries(slips.length)}
              </AppText>
            }
          >
            {visible.map((entry) => (
              <SlipHistoryItem
                key={entry.id}
                entry={entry}
                now={now}
                onDelete={deleteSlip}
                onReflect={(slip) => setReflecting({ slip })}
              />
            ))}
          </ListGroup>
          {slips.length > visibleCount ? (
            <Button
              label={t.showMore}
              variant="secondary"
              onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
            />
          ) : null}
        </View>
      )}

      <ReflectionSheet
        slip={reflecting?.slip ?? null}
        initialTrigger={reflecting?.trigger}
        onClose={() => setReflecting(null)}
      />
    </Screen>
  );
}
