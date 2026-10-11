import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import { usePro } from "../context/ProContext";
import type { RootStackScreenProps } from "../navigation/types";
import type { PlanView } from "../services/purchases";
import { cn } from "../utils/cn";
import { haptics } from "../utils/haptics";
import { PAYWALL_HEADLINES, PLAN_ROWS, type PlanRow } from "../utils/pro";
import { useThemeColors } from "../utils/theme";

export function PaywallScreen({ navigation, route }: RootStackScreenProps<"Paywall">) {
  const { colors } = useThemeColors();
  const pro = usePro();
  const { loadPlans } = pro;
  const headline = PAYWALL_HEADLINES[route.params?.feature ?? "default"];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (pro.status === "ready") loadPlans();
  }, [pro.status, loadPlans]);

  const selected =
    pro.plans.find((plan) => plan.id === selectedId) ??
    pro.plans.find((plan) => plan.isBestValue) ??
    pro.plans[0];

  const close = () => navigation.goBack();

  const handlePurchase = async () => {
    if (!selected) return;
    setBusy("purchase");
    setMessage(null);
    const result = await pro.purchase(selected.pkg);
    setBusy(null);
    if (result.ok) {
      haptics.success();
      return;
    }
    if (!result.cancelled) setMessage(result.message);
  };

  const handleRestore = async () => {
    setBusy("restore");
    setMessage(null);
    const result = await pro.restore();
    setBusy(null);
    if (!result.ok) setMessage(result.message);
    else if (result.restored) haptics.success();
    else setMessage("Активных покупок не найдено для этого аккаунта магазина.");
  };

  return (
    <Screen>
      <View className="flex-row justify-end">
        <IconButton icon="close" onPress={close} accessibilityLabel="Закрыть" />
      </View>

      <View className="items-center gap-3 px-2">
        <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-brand-600 dark:bg-brand-500">
          <Ionicons name="shield-checkmark" size={40} color={colors.onPrimary} />
        </View>
        <AppText variant="overline" tone="primary">
          StopScroll Pro
        </AppText>
        <AppText
          variant="title"
          className="text-center text-[28px] leading-9"
          accessibilityRole="header"
        >
          {pro.isPro ? "Pro уже с вами" : headline.title}
        </AppText>
        <AppText tone="muted" className="text-center">
          {pro.isPro
            ? "Все упражнения, замены и аналитика открыты. Спасибо, что поддерживаете приложение!"
            : headline.text}
        </AppText>
      </View>

      <ComparisonTable />

      {pro.isPro ? (
        <Button label="Готово" size="lg" icon="checkmark-circle" onPress={close} />
      ) : pro.status === "loading" || pro.plansLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : pro.status === "unavailable" ? (
        <UnavailableNotice />
      ) : pro.plans.length === 0 ? (
        <Card tone="muted" className="gap-3">
          <AppText variant="caption" tone="muted">
            {pro.plansError ?? "Не удалось загрузить тарифы."}
          </AppText>
          <Button label="Повторить" icon="refresh" variant="secondary" onPress={loadPlans} />
        </Card>
      ) : (
        <View className="gap-3">
          {pro.plans.map((plan) => (
            <PlanOption
              key={plan.id}
              plan={plan}
              selected={plan.id === selected?.id}
              onPress={() => {
                haptics.selection();
                setSelectedId(plan.id);
              }}
            />
          ))}
          <Button
            label={selected?.trial ? `Начать: ${selected.trial}` : "Оформить Pro"}
            size="lg"
            icon="sparkles"
            loading={busy === "purchase"}
            disabled={busy !== null || !selected}
            onPress={handlePurchase}
            className="mt-1"
          />
        </View>
      )}

      {message ? (
        <View
          className="flex-row items-start gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/40"
          accessibilityLiveRegion="polite"
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.warningStrong} />
          <AppText variant="caption" className="flex-1">
            {message}
          </AppText>
        </View>
      ) : null}

      {!pro.isPro && pro.status === "ready" ? (
        <Button
          label="Восстановить покупки"
          variant="ghost"
          loading={busy === "restore"}
          disabled={busy !== null}
          onPress={handleRestore}
        />
      ) : null}

      <AppText variant="caption" tone="subtle" className="text-center text-xs leading-4">
        Подписка продлевается автоматически, пока вы её не отмените. Отменить можно в любой момент в
        настройках App Store или Google Play — не позднее чем за 24 часа до конца периода.
      </AppText>
    </Screen>
  );
}

function ComparisonTable() {
  return (
    <Card className="gap-1 p-0">
      <View className="flex-row items-center px-4 pb-2 pt-4">
        <AppText variant="overline" tone="muted" className="flex-1">
          Возможности
        </AppText>
        <AppText variant="overline" tone="muted" className="w-14 text-center">
          Free
        </AppText>
        <AppText variant="overline" tone="primary" className="w-14 text-center">
          Pro
        </AppText>
      </View>
      {PLAN_ROWS.map((row, index) => (
        <PlanRowView key={row.label} row={row} last={index === PLAN_ROWS.length - 1} />
      ))}
    </Card>
  );
}

function PlanRowView({ row, last }: { row: PlanRow; last: boolean }) {
  const { colors } = useThemeColors();
  const describe = (value: string | boolean) =>
    value === true ? "есть" : value === false ? "нет" : value;
  return (
    <View
      className={cn(
        "flex-row items-center gap-3 px-4 py-3",
        !last && "border-b border-slate-100 dark:border-ink-800",
      )}
      accessible
      accessibilityLabel={`${row.label}: бесплатно — ${describe(row.free)}, Pro — ${describe(row.pro)}`}
    >
      <Ionicons name={row.icon} size={18} color={colors.textMuted} />
      <AppText variant="caption" className="flex-1">
        {row.label}
      </AppText>
      <Cell value={row.free} />
      <Cell value={row.pro} highlight />
    </View>
  );
}

function Cell({ value, highlight = false }: { value: string | boolean; highlight?: boolean }) {
  const { colors } = useThemeColors();
  return (
    <View className="w-14 items-center">
      {value === true ? (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={highlight ? colors.primary : colors.textMuted}
        />
      ) : value === false ? (
        <Ionicons name="remove" size={18} color={colors.textSubtle} />
      ) : (
        <AppText variant="label" tone={highlight ? "primary" : "muted"}>
          {value}
        </AppText>
      )}
    </View>
  );
}

function PlanOption({
  plan,
  selected,
  onPress,
}: {
  plan: PlanView;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.title}, ${plan.price}${plan.caption ? `, ${plan.caption}` : ""}${plan.trial ? `, ${plan.trial}` : ""}`}
      className={cn(
        "flex-row items-center gap-4 rounded-3xl border-2 bg-white p-4 active:opacity-90 dark:bg-ink-900",
        selected
          ? "border-brand-600 dark:border-brand-400"
          : "border-slate-200 dark:border-ink-800",
      )}
    >
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={selected ? colors.primary : colors.textSubtle}
      />
      <View className="flex-1 gap-0.5">
        <View className="flex-row flex-wrap items-center gap-2">
          <AppText variant="label" className="text-base">
            {plan.title}
          </AppText>
          {plan.savings ? (
            <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950/60">
              <AppText
                variant="caption"
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-300"
              >
                −{plan.savings}%
              </AppText>
            </View>
          ) : null}
        </View>
        {plan.trial || plan.caption ? (
          <AppText variant="caption" tone="muted">
            {[plan.trial, plan.caption].filter(Boolean).join(" · ")}
          </AppText>
        ) : null}
      </View>
      <AppText variant="heading">{plan.price}</AppText>
    </Pressable>
  );
}

function UnavailableNotice() {
  const pro = usePro();
  return (
    <Card tone="muted" className="gap-3">
      <AppText variant="label">Покупки не подключены в этой сборке</AppText>
      <AppText variant="caption" tone="muted">
        Укажите ключи RevenueCat в файле .env (см. .env.example) и пересоберите приложение — тарифы
        появятся здесь автоматически.
      </AppText>
      {__DEV__ ? (
        <Button
          label={pro.devPro ? "Выключить тестовый Pro" : "Включить Pro для теста"}
          icon="construct-outline"
          variant="secondary"
          onPress={() => pro.setDevPro(!pro.devPro)}
        />
      ) : null}
    </Card>
  );
}
