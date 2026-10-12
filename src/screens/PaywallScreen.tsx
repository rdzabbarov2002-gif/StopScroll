import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { PACKAGE_TYPE } from "react-native-purchases";

import { AppIconMark } from "../components/AppIconMark";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Separator } from "../components/CardLabel";
import { IconButton } from "../components/IconButton";
import { LegalLinks } from "../components/LegalLinks";
import { Screen } from "../components/Screen";
import { usePro } from "../context/ProContext";
import type { RootStackScreenProps } from "../navigation/types";
import type { PlanView } from "../services/purchases";
import { cn } from "../utils/cn";
import { DEMO_MODE } from "../utils/demo";
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

      <View className="items-center gap-1.5 px-2 pb-2">
        <View
          className="mb-2"
          style={{
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <AppIconMark size={76} />
        </View>
        <AppText
          className="text-center text-[28px] font-bold leading-[34px] tracking-tight"
          accessibilityRole="header"
        >
          {pro.isPro ? "Pro уже с вами" : "StopScroll Pro"}
        </AppText>
        <AppText variant="heading" className="text-center">
          {pro.isPro ? "Спасибо, что поддерживаете приложение!" : headline.title}
        </AppText>
        <AppText variant="caption" tone="muted" className="text-center">
          {pro.isPro ? "Все упражнения, замены и аналитика открыты." : headline.text}
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
          <View className="flex-row flex-wrap gap-2.5 pt-2">
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
          </View>
          <Button
            label={selected?.trial ? `Попробовать ${selected.trial}` : "Оформить Pro"}
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

      {!pro.isPro && selected && selected.pkg.packageType !== PACKAGE_TYPE.LIFETIME ? (
        <AppText variant="caption" tone="subtle" className="text-center text-xs leading-4">
          Подписка «{selected.title}» за {selected.price} продлевается автоматически, пока вы её не
          отмените. Отменить можно в любой момент в настройках App Store или Google Play — не
          позднее чем за 24 часа до конца периода.
        </AppText>
      ) : null}

      <LegalLinks />
    </Screen>
  );
}

function ComparisonTable() {
  return (
    <Card className="p-0">
      <View className="flex-row items-center px-4 pb-2 pt-3.5">
        <View className="flex-1" />
        <AppText variant="label" tone="subtle" className="w-16 text-center text-[13px]">
          Free
        </AppText>
        <AppText variant="label" tone="primary" className="w-24 text-center text-[13px]">
          Pro
        </AppText>
      </View>
      {PLAN_ROWS.map((row) => (
        <PlanRowView key={row.label} row={row} />
      ))}
    </Card>
  );
}

function PlanRowView({ row }: { row: PlanRow }) {
  const describe = (value: string | boolean) =>
    value === true ? "есть" : value === false ? "нет" : value;
  return (
    <View
      accessible
      accessibilityLabel={`${row.label}: бесплатно — ${describe(row.free)}, Pro — ${describe(row.pro)}`}
    >
      <Separator className="ml-4" />
      <View className="min-h-[46px] flex-row items-center px-4 py-2">
        <AppText variant="body" className="flex-1 text-[16px]" numberOfLines={2}>
          {row.label}
        </AppText>
        <Cell value={row.free} width="w-16" />
        <Cell value={row.pro} width="w-24" highlight />
      </View>
    </View>
  );
}

function Cell({
  value,
  width,
  highlight = false,
}: {
  value: string | boolean;
  width: string;
  highlight?: boolean;
}) {
  const { colors } = useThemeColors();
  return (
    <View className={cn("items-center", width)}>
      {value === true ? (
        <Ionicons name="checkmark" size={22} color={colors.primary} />
      ) : value === false ? (
        <View className="h-0.5 w-3 rounded-full" style={{ backgroundColor: colors.ringTrack }} />
      ) : (
        <AppText
          variant="label"
          tone={highlight ? "default" : "subtle"}
          className="text-center text-[14px]"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
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
      className="min-w-[45%] flex-1 gap-1.5 rounded-[20px] bg-card p-3.5 active:opacity-90 dark:bg-ink-900"
      style={{
        borderWidth: selected ? 2.5 : 0.5,
        borderColor: selected ? colors.primary : colors.separator,
      }}
    >
      {plan.savings ? (
        <View className="absolute -top-2.5 right-3 rounded-full bg-brand-600 px-2 py-0.5 dark:bg-brand-500">
          <AppText variant="label" className="text-[12px] text-white dark:text-white">
            −{plan.savings}%
          </AppText>
        </View>
      ) : null}
      <View className="flex-row items-center justify-between gap-2">
        <AppText variant="heading" className="text-[15px]">
          {plan.title}
        </AppText>
        {selected ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        ) : (
          <View
            className="h-5 w-5 rounded-full"
            style={{ borderWidth: 1.5, borderColor: colors.ringTrack }}
          />
        )}
      </View>
      <AppText
        rounded
        className="text-[24px] font-bold leading-[30px]"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {plan.price}
      </AppText>
      <AppText variant="caption" tone="subtle" className="text-[13px] leading-[17px]">
        {[plan.trial, plan.caption].filter(Boolean).join(" · ") ||
          (plan.pkg.packageType === PACKAGE_TYPE.MONTHLY
            ? "в месяц"
            : plan.pkg.packageType === PACKAGE_TYPE.WEEKLY
              ? "в неделю"
              : "")}
      </AppText>
    </Pressable>
  );
}

function UnavailableNotice() {
  const pro = usePro();
  return (
    <Card tone="muted" className="gap-3">
      <AppText variant="label">
        {DEMO_MODE
          ? "Это демо-версия: оплата отключена"
          : __DEV__
            ? "Покупки не подключены в этой сборке"
            : "Покупки временно недоступны"}
      </AppText>
      <AppText variant="caption" tone="muted">
        {DEMO_MODE
          ? "В приложении из App Store и Google Play здесь будут тарифы. Чтобы посмотреть Pro-функции, включите тестовый Pro."
          : __DEV__
            ? "Укажите ключи RevenueCat в .env.local (см. .env.example) и перезапустите сборку — тарифы появятся здесь автоматически."
            : "Не удалось связаться с магазином. Попробуйте позже — все бесплатные функции продолжают работать."}
      </AppText>
      {__DEV__ || DEMO_MODE ? (
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
