import { useMemo, useState } from "react";
import { View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
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
import type { RootTabScreenProps } from "../navigation/types";
import { computePatterns } from "../utils/analytics";
import { ENTRY_FORMS, pluralize } from "../utils/date";
import { useNow } from "../utils/useNow";

const PAGE_SIZE = 15;

export function JournalScreen({ route }: RootTabScreenProps<"Journal">) {
  const { slips, wins, deleteSlip } = useApp();
  const { isPro } = usePro();
  const now = useNow(60_000);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const prefill = route.params?.trigger;

  const patterns = useMemo(() => computePatterns(slips, wins, now), [slips, wins, now]);
  const visible = slips.slice(0, visibleCount);

  return (
    <Screen>
      <View className="gap-1 px-1 pb-1 pt-3">
        <AppText variant="title" accessibilityRole="header">
          Дневник
        </AppText>
        <AppText variant="caption" tone="muted">
          Запишите срыв за 10 секунд — без самокритики. Через пару записей станут видны паттерны.
        </AppText>
      </View>

      {/* Remount on every hand-over from the SOS screen, so the form starts pre-filled. */}
      <SlipForm key={String(route.params?.handoffAt ?? 0)} initialTrigger={prefill} />

      <PatternsCard patterns={patterns} />

      <View className="gap-3">
        <View className="flex-row items-center gap-2 px-1 pt-2">
          <AppText variant="overline" tone="subtle" accessibilityRole="header">
            Глубокая аналитика
          </AppText>
          {!isPro ? <ProBadge /> : null}
        </View>
        {isPro ? (
          <DeepAnalytics patterns={patterns} />
        ) : (
          <LockedCard
            feature="analytics"
            title="Часы и дни недели, когда лента побеждает"
            text="Графики срывов по часам и дням, а также разбор: где вы удерживаетесь, а где — нет."
          />
        )}
      </View>

      {slips.length === 0 ? (
        <EmptyState
          icon="journal-outline"
          title="Записей пока нет"
          text="И это отлично. Если лента всё же победит — отметьте это здесь, чтобы увидеть закономерности."
        />
      ) : (
        <View className="gap-3">
          <ListGroup
            header="История срывов"
            headerRight={
              <AppText variant="caption" tone="subtle" className="text-[13px]">
                {slips.length} {pluralize(slips.length, ENTRY_FORMS)}
              </AppText>
            }
          >
            {visible.map((entry) => (
              <SlipHistoryItem key={entry.id} entry={entry} now={now} onDelete={deleteSlip} />
            ))}
          </ListGroup>
          {slips.length > visibleCount ? (
            <Button
              label="Показать ещё"
              variant="secondary"
              onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}
