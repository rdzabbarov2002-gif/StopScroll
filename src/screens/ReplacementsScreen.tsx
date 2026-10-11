import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { CustomReplacementSheet } from "../components/CustomReplacementSheet";
import { EmptyState } from "../components/EmptyState";
import { ProBadge } from "../components/ProBadge";
import { ReplacementCard } from "../components/ReplacementCard";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { StatTile } from "../components/StatTile";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import type { RootTabScreenProps } from "../navigation/types";
import { CATEGORIES } from "../utils/catalog";
import { WIN_FORMS, formatMinutes, pluralize } from "../utils/date";
import { MAX_CUSTOM_REPLACEMENTS } from "../utils/persistedState";
import { customToReplacement, getAllReplacements, isLocked } from "../utils/replacements";
import { summarizeWins } from "../utils/stats";
import type { IconName, Replacement, ReplacementCategory } from "../utils/types";

type Filter = "all" | ReplacementCategory | "mine";

const FILTERS: readonly { id: Filter; label: string; icon?: IconName }[] = [
  { id: "all", label: "Все" },
  ...CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    icon: category.icon,
  })),
  { id: "mine", label: "Мои", icon: "person-outline" },
];

export function ReplacementsScreen({ navigation, route }: RootTabScreenProps<"Replacements">) {
  const app = useApp();
  const { isPro } = usePro();
  const [filter, setFilter] = useState<Filter>(route.params?.category ?? "all");
  const [sheetVisible, setSheetVisible] = useState(false);

  const saved = summarizeWins(app.wins, app.winArchive, app.todayKey);
  const replacementWins =
    app.wins.filter((win) => win.source === "replacement").length + app.winArchive.replacementCount;

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
      <ScreenHeader
        eyebrow="Микро-замены"
        title="Здоровый дофамин"
        subtitle="1–3 минуты настоящего действия вместо бесконечной ленты."
      />

      <View className="flex-row gap-3">
        <StatTile
          icon="trophy-outline"
          tone="primary"
          value={String(saved.todayWins)}
          unit={pluralize(saved.todayWins, WIN_FORMS)}
          label="Сегодня"
        />
        <StatTile
          icon="hourglass-outline"
          tone="primary"
          value={formatMinutes(saved.todayMinutes)}
          label="Спасено сегодня"
        />
        <StatTile
          icon="swap-horizontal-outline"
          value={String(replacementWins)}
          label="Замен всего"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="-mx-5 grow-0 px-5"
      >
        {FILTERS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            icon={item.icon}
            selected={filter === item.id}
            onPress={() => setFilter(item.id)}
          />
        ))}
      </ScrollView>

      {filter === "mine" || filter === "all" ? (
        <View className="flex-row items-center gap-3 rounded-3xl bg-brand-50 p-4 dark:bg-brand-950/40">
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <AppText variant="label" className="text-base">
                Свои замены
              </AppText>
              {!isPro ? <ProBadge /> : null}
            </View>
            <AppText variant="caption" tone="muted">
              Добавьте привычку, которая заряжает именно вас.
            </AppText>
          </View>
          <Button
            label="Добавить"
            icon="add"
            onPress={createCustom}
            disabled={isPro && !canAddMore}
            className="h-10 px-4"
          />
        </View>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState
          icon="create-outline"
          title="Пока пусто"
          text={
            isPro
              ? "Нажмите «Добавить», чтобы создать первую свою замену."
              : "Свои замены доступны в Pro."
          }
        />
      ) : (
        <View className="gap-3">
          {sorted.map((item) => (
            <ReplacementCard
              key={item.id}
              item={item}
              locked={isLocked(item, isPro)}
              onPress={() => open(item)}
            />
          ))}
        </View>
      )}

      <CustomReplacementSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </Screen>
  );
}
