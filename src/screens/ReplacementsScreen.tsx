import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CardLabel } from "../components/CardLabel";
import { categoryColor } from "../components/categoryColors";
import { CustomReplacementSheet } from "../components/CustomReplacementSheet";
import { EmptyState } from "../components/EmptyState";
import { IconButton } from "../components/IconButton";
import { ListGroup, ListRow } from "../components/ListGroup";
import { ProBadge } from "../components/ProBadge";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import type { RootTabScreenProps } from "../navigation/types";
import { computePatterns } from "../utils/analytics";
import { CATEGORIES, getCategory } from "../utils/catalog";
import { dayKey, formatMinutes, pluralize } from "../utils/date";
import { MAX_CUSTOM_REPLACEMENTS } from "../utils/persistedState";
import {
  customToReplacement,
  getAllReplacements,
  isLocked,
  suggestReplacements,
} from "../utils/replacements";
import { useThemeColors } from "../utils/theme";
import type { Replacement, ReplacementCategory, TriggerId } from "../utils/types";
import { useNow } from "../utils/useNow";

type Filter = "all" | ReplacementCategory | "mine";

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: "all", label: "Все" },
  ...CATEGORIES.map((category) => ({ value: category.id, label: category.label })),
  { value: "mine", label: "Свои" },
];

const REPLACEMENT_FORMS = ["замена", "замены", "замен"] as const;

/** "Когда тянет в ленту от скуки…" — a short reason for the most frequent trigger. */
const TRIGGER_PHRASE: Record<TriggerId, string> = {
  boredom: "от скуки",
  fatigue: "от усталости",
  stress: "от стресса",
  loneliness: "от одиночества",
  procrastination: "вместо дела",
  autopilot: "на автопилоте",
  relax: "чтобы расслабиться",
  sleepless: "когда не спится",
  other: "",
};

export function ReplacementsScreen({ navigation, route }: RootTabScreenProps<"Replacements">) {
  const { colors } = useThemeColors();
  const app = useApp();
  const { isPro } = usePro();
  const now = useNow(60_000);
  const [filter, setFilter] = useState<Filter>(route.params?.category ?? "all");
  const [sheetVisible, setSheetVisible] = useState(false);

  // Replacements done today: how many, how much time they bought back, and which ones.
  const todayWins = app.wins.filter(
    (win) => win.source === "replacement" && dayKey(win.timestamp) === app.todayKey,
  );
  const doneToday = new Map<string, number>();
  for (const win of todayWins) {
    if (win.replacementId) {
      doneToday.set(win.replacementId, (doneToday.get(win.replacementId) ?? 0) + win.minutesSaved);
    }
  }
  const todayMinutes = todayWins.reduce((sum, win) => sum + win.minutesSaved, 0);

  const patterns = useMemo(
    () => computePatterns(app.slips, app.wins, now),
    [app.slips, app.wins, now],
  );
  // A suggestion that is open to the user and not already done today.
  const suggestions = suggestReplacements(patterns.topTrigger ?? undefined, isPro, 12).filter(
    (item) => !isLocked(item, isPro),
  );
  const pick = suggestions.find((item) => !doneToday.has(item.id)) ?? suggestions[0];

  const items: Replacement[] =
    filter === "mine"
      ? app.customReplacements.map(customToReplacement)
      : getAllReplacements(app.customReplacements).filter(
          (item) => filter === "all" || item.category === filter,
        );
  // Unlocked first, so the free catalog never hides behind Pro items.
  const sorted = [...items].sort((a, b) => Number(isLocked(a, isPro)) - Number(isLocked(b, isPro)));

  const open = (item: Replacement) =>
    isLocked(item, isPro)
      ? navigation.navigate("Paywall", { feature: "replacements" })
      : navigation.navigate("Replacement", { id: item.id });

  const createCustom = () => {
    if (!isPro) {
      navigation.navigate("Paywall", { feature: "custom" });
      return;
    }
    setSheetVisible(true);
  };

  const canAddMore = app.customReplacements.length < MAX_CUSTOM_REPLACEMENTS;

  return (
    <Screen>
      <View className="flex-row items-end justify-between gap-3 px-1 pb-1">
        <AppText variant="title" accessibilityRole="header">
          Замены
        </AppText>
        <IconButton
          icon="add"
          size={22}
          tone="accent"
          className="mb-1 h-[38px] w-[38px]"
          onPress={createCustom}
          accessibilityLabel="Добавить свою замену"
        />
      </View>

      {pick ? (
        <Card>
          <CardLabel icon="sparkles" label="Подходит сейчас" color={colors.primary} />
          <AppText variant="statement" className="mt-2">
            {patterns.topTrigger && TRIGGER_PHRASE[patterns.topTrigger]
              ? `Когда тянет в ленту ${TRIGGER_PHRASE[patterns.topTrigger]}, попробуйте «${pick.title}».`
              : `Попробуйте «${pick.title}» вместо ленты.`}
          </AppText>
          <View className="mt-3.5 flex-row items-center justify-between gap-3">
            <AppText variant="caption" tone="subtle" className="shrink" numberOfLines={1}>
              {pick.minutes} мин · {getCategory(pick.category).label}
            </AppText>
            <Button label="Начать" onPress={() => open(pick)} className="h-9 px-5" />
          </View>
        </Card>
      ) : null}

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} className="mt-1" />

      {sorted.length === 0 ? (
        <View className="gap-3 pt-2">
          <EmptyState
            icon="create-outline"
            title="Пока пусто"
            text={
              isPro
                ? "Добавьте привычку, которая заряжает именно вас: гитара, отжимания, страница книги."
                : "Свои замены и привычки доступны в Pro."
            }
          />
          <Button
            label={isPro ? "Добавить свою замену" : "Открыть Pro"}
            icon={isPro ? "add" : "sparkles"}
            onPress={createCustom}
          />
        </View>
      ) : (
        <ListGroup
          header={
            todayWins.length > 0
              ? `Сегодня ${todayWins.length} ${pluralize(todayWins.length, REPLACEMENT_FORMS)}`
              : "Каталог"
          }
          headerRight={
            todayMinutes > 0 ? (
              <AppText variant="label" tone="success">
                +{formatMinutes(todayMinutes)}
              </AppText>
            ) : null
          }
        >
          {sorted.map((item) => {
            const locked = isLocked(item, isPro);
            const done = doneToday.get(item.id);
            return (
              <ListRow
                key={item.id}
                icon={item.icon}
                iconColor={locked ? colors.textSubtle : categoryColor(item.category, colors)}
                title={item.title}
                subtitle={
                  filter === "all" || filter === "mine"
                    ? `${item.minutes} мин · ${getCategory(item.category).label}`
                    : `${item.minutes} мин`
                }
                onPress={() => open(item)}
                chevron={!locked && done === undefined}
                accessibilityLabel={`${item.title}, ${item.minutes} мин${locked ? ", доступно в Pro" : ""}${done !== undefined ? ", сделано сегодня" : ""}`}
                right={
                  locked ? (
                    <ProBadge />
                  ) : done !== undefined ? (
                    <View className="flex-row items-center gap-1.5">
                      <AppText variant="label" tone="success" className="text-[13px]">
                        +{formatMinutes(done)}
                      </AppText>
                      <Ionicons name="checkmark-circle" size={22} color={colors.successBright} />
                    </View>
                  ) : undefined
                }
              />
            );
          })}
          {filter === "mine" && isPro && canAddMore ? (
            <ListRow
              icon="add"
              iconColor={colors.primary}
              title="Добавить свою замену"
              onPress={createCustom}
            />
          ) : null}
        </ListGroup>
      )}

      <CustomReplacementSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </Screen>
  );
}
