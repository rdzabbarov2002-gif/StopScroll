import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { AppText } from "../components/AppText";
import { BackButton } from "../components/BackButton";
import { Card } from "../components/Card";
import { CardLabel, DurationValue, KeyValue, Separator } from "../components/CardLabel";
import { WeeklyReviewCard } from "../components/coach/WeeklyReviewCard";
import { ColumnChart, type ColumnDatum } from "../components/charts/ColumnChart";
import { EmptyState } from "../components/EmptyState";
import { IconButton } from "../components/IconButton";
import { ListGroup, ListRow } from "../components/ListGroup";
import { ChartLegend, SlotsChart, SuccessRing } from "../components/report/ReportCharts";
import { Screen } from "../components/Screen";
import { buildWeeklyReview } from "../coach";
import { useApp } from "../context/AppContext";
import type { RootStackScreenProps } from "../navigation/types";
import { getTrigger } from "../utils/catalog";
import {
  DAY_FORMS,
  TIMES_FORMS,
  WEEKDAYS_SHORT,
  WIN_FORMS,
  addDays,
  formatHourRange,
  formatMinutes,
  formatMinutesCompact,
  formatMinutesInline,
  formatWeekRange,
  pluralize,
  weekdayName,
} from "../utils/date";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { useNow } from "../utils/useNow";
import {
  buildWeeklyReport,
  compareReports,
  isEmptyReport,
  latestReportWeek,
  reportWeeks,
  type ReportChange,
  type WeeklyReport,
} from "../utils/weeklyReport";

const SLIP_FORMS = ["срыв", "срыва", "срывов"] as const;
const IMPULSE_FORMS = ["импульс", "импульса", "импульсов"] as const;
const REPLACEMENT_FORMS = ["замена", "замены", "замен"] as const;

export function WeeklyReportScreen({ route }: RootStackScreenProps<"WeeklyReport">) {
  const app = useApp();
  const now = useNow(60_000);
  const data = useMemo(
    () => ({
      wins: app.wins,
      slips: app.slips,
      scrollLog: app.scrollLog,
      settings: app.settings,
    }),
    [app.wins, app.slips, app.scrollLog, app.settings],
  );
  const weeks = useMemo(() => reportWeeks(data, now), [data, now]);
  const latest = latestReportWeek(now);
  const [week, setWeek] = useState(() => {
    const requested = route.params?.week;
    return requested && weeks.includes(requested) ? requested : (weeks[0] ?? latest);
  });

  const report = useMemo(() => buildWeeklyReport(data, week, now), [data, week, now]);
  const previous = useMemo(
    () => buildWeeklyReport(data, addDays(week, -7), now),
    [data, week, now],
  );
  const hasPrevious = !isEmptyReport(previous);
  const review = useMemo(() => buildWeeklyReview(data, week, now), [data, week, now]);

  const { markReportSeen } = app;
  useEffect(() => {
    if (week === latest) markReportSeen(week);
  }, [week, latest, markReportSeen]);

  const index = weeks.indexOf(week);
  const older = index >= 0 ? weeks[index + 1] : undefined;
  const newer = index > 0 ? weeks[index - 1] : undefined;

  return (
    <Screen>
      <BackButton label="Назад" />
      <View className="flex-row items-end justify-between gap-3 px-1 pb-1">
        <View className="flex-1">
          <AppText variant="overline" tone="subtle">
            {formatWeekRange(week)}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            Неделя
          </AppText>
        </View>
        {weeks.length > 1 ? (
          <View className="mb-1 flex-row gap-2">
            <IconButton
              icon="chevron-back"
              onPress={() => older && setWeek(older)}
              accessibilityLabel="Неделей раньше"
              className={older ? "" : "opacity-30"}
            />
            <IconButton
              icon="chevron-forward"
              onPress={() => newer && setWeek(newer)}
              accessibilityLabel="Неделей позже"
              className={newer ? "" : "opacity-30"}
            />
          </View>
        ) : null}
      </View>

      {weeks.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Первый отчёт — в воскресенье"
          text="Каждое воскресенье вечером ваш персональный коуч разбирает неделю: что получилось, где лента выигрывает и что попробовать дальше. Отмечайте время и срывы — разбору будет на что опереться."
        />
      ) : isEmptyReport(report) ? (
        <EmptyState
          icon="leaf-outline"
          title="Тихая неделя"
          text="За эти дни нет записей: ни побед над импульсом, ни срывов, ни отмеченного времени."
        />
      ) : (
        <ReportBody report={report} previous={hasPrevious ? previous : null} />
      )}

      {review ? <WeeklyReviewCard sections={review} /> : null}
    </Screen>
  );
}

function ReportBody({ report, previous }: { report: WeeklyReport; previous: WeeklyReport | null }) {
  const { colors, chart } = useThemeColors();
  const app = useApp();
  const limit = app.settings.dailyLimitMinutes;
  const changes = previous ? compareReports(report, previous) : [];
  const savedChange = changes.find((change) => change.id === "saved");
  const impulses = report.wins + report.slips;

  const savedData: ColumnDatum[] = report.days.map((day, index) => ({
    key: day.key,
    value: day.saved,
    label: WEEKDAYS_SHORT[index],
    a11y: `${WEEKDAYS_SHORT[index]}: спасено ${formatMinutes(day.saved)}`,
  }));
  const scrollData: ColumnDatum[] = report.days.map((day, index) => ({
    key: day.key,
    value: day.scroll,
    label: WEEKDAYS_SHORT[index],
    a11y: `${WEEKDAYS_SHORT[index]}: ${day.scroll === null ? "нет записи" : formatMinutes(day.scroll)}`,
  }));
  const bestDay = report.days.reduce<number | null>(
    (best, day, index) =>
      day.saved > 0 && (best === null || day.saved > report.days[best]!.saved) ? index : best,
    null,
  );

  return (
    <>
      <Card>
        <CardLabel icon="leaf" label="Спасено" color={colors.success} />
        <AppText variant="statement" className="mt-2">
          {savedChange && savedChange.delta !== 0
            ? `На ${formatMinutesInline(Math.abs(savedChange.delta))} ${savedChange.delta > 0 ? "больше" : "меньше"}, чем неделей раньше.`
            : report.savedMinutes > 0
              ? `Каждая пауза и замена этой недели — ${formatMinutesInline(report.savedMinutes)} вашей жизни.`
              : "На этой неделе время ещё не спасено — следующая SOS-пауза это исправит."}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <DurationValue label="За неделю" minutes={report.savedMinutes} color={colors.success} />
          <KeyValue
            label="Побед"
            value={String(report.wins)}
            unit={pluralize(report.wins, WIN_FORMS)}
            color={colors.textSubtle}
          />
        </View>
        <View className="mt-4">
          <ColumnChart
            data={savedData}
            highlightKey={bestDay !== null ? report.days[bestDay]!.key : null}
            formatTick={formatMinutesCompact}
            showYAxis={false}
            plotHeight={84}
            colorFor={(_datum, highlighted) =>
              highlighted ? colors.successBright : chart.seriesMuted
            }
          />
        </View>
      </Card>

      <View className="flex-row flex-wrap gap-3">
        <MetricTile
          icon="checkmark-done-circle"
          color={colors.primary}
          label="В лимите"
          value={report.daysInLimit}
          unit={`из ${report.loggedDays} ${pluralize(report.loggedDays, DAY_FORMS)}`}
        />
        <MetricTile
          icon="alert-circle"
          color={colors.warningStrong}
          label="Срывы"
          value={report.slips}
          unit={pluralize(report.slips, SLIP_FORMS)}
          change={changes.find((change) => change.id === "slips")}
        />
        <MetricTile
          icon="sparkles"
          color={colors.indigo}
          label="Замены"
          value={report.replacements}
          unit={pluralize(report.replacements, REPLACEMENT_FORMS)}
        />
        <MetricTile
          icon="flame"
          color={colors.warning}
          label="Серия"
          value={report.currentStreak}
          unit={pluralize(report.currentStreak, DAY_FORMS)}
          caption={`Рекорд — ${report.bestStreak} ${pluralize(report.bestStreak, DAY_FORMS)}`}
        />
      </View>

      <Card>
        <CardLabel icon="pulse" label="Импульсы" color={colors.successBright} />
        <View className="mt-3 flex-row items-center gap-5">
          <SuccessRing rate={report.successRate} />
          <View className="flex-1 gap-2">
            <AppText variant="statement">
              {report.successRate === null
                ? "Импульсов не было."
                : `${Math.round(report.successRate * 100)}% импульсов прошли без ленты.`}
            </AppText>
            <AppText variant="caption" tone="muted">
              {impulses} {pluralize(impulses, IMPULSE_FORMS)}: {report.wins}{" "}
              {pluralize(report.wins, WIN_FORMS)}, {report.slips}{" "}
              {pluralize(report.slips, SLIP_FORMS)}.
            </AppText>
          </View>
        </View>
        <Separator className="my-3.5" />
        <AppText variant="label" className="mb-2">
          По времени суток
        </AppText>
        <SlotsChart slots={report.slots} />
        <ChartLegend
          items={[
            { label: "Удержались", color: chart.series },
            { label: "Срывы", color: chart.slip },
          ]}
        />
      </Card>

      <ListGroup header="Самое трудное">
        <ListRow
          icon="calendar"
          iconColor={colors.warningStrong}
          title="Опасный день"
          subtitle={
            report.hardestDay === null
              ? "Нет данных"
              : report.hardestDay.basis === "slips"
                ? `${report.hardestDay.value} ${pluralize(report.hardestDay.value, SLIP_FORMS)}`
                : `Больше всего ленты: ${formatMinutes(report.hardestDay.value)}`
          }
          value={report.hardestDay ? weekdayName(report.hardestDay.index) : "—"}
        />
        <ListRow
          icon="time"
          iconColor={colors.indigo}
          title="Опасное время"
          subtitle={
            report.hardestHour === null
              ? "Нет данных"
              : report.hardestHour.basis === "slips"
                ? `${report.hardestHour.count} ${pluralize(report.hardestHour.count, SLIP_FORMS)}`
                : `Чаще всего тянет в ленту · ${report.hardestHour.count} ${pluralize(report.hardestHour.count, TIMES_FORMS)}`
          }
          value={report.hardestHour ? formatHourRange(report.hardestHour.hour) : "—"}
        />
        <ListRow
          icon={report.topTrigger ? getTrigger(report.topTrigger.id).icon : "happy"}
          iconColor={colors.danger}
          title="Частая причина"
          subtitle={
            report.topTrigger
              ? `${report.topTrigger.count} ${pluralize(report.topTrigger.count, SLIP_FORMS)} из ${report.slips}`
              : "Срывов не было"
          }
          value={report.topTrigger ? getTrigger(report.topTrigger.id).label : "—"}
        />
      </ListGroup>

      <Card>
        <CardLabel icon="phone-portrait" label="Лента по дням" color={colors.primary} />
        <AppText variant="statement" className="mt-2">
          {report.scrollAverage === null
            ? "Время в ленте на этой неделе не отмечено."
            : `В среднем ${formatMinutesInline(report.scrollAverage)} в день · ${report.daysInLimit} из ${report.loggedDays} ${pluralize(report.loggedDays, DAY_FORMS)} в пределах лимита.`}
        </AppText>
        <View className="mt-4">
          <ColumnChart
            data={scrollData}
            reference={{ value: limit, label: `лимит ${formatMinutes(limit)}` }}
            formatTick={formatMinutesCompact}
            plotHeight={110}
            colorFor={(datum) =>
              datum.value !== null && datum.value > limit ? chart.slip : chart.series
            }
          />
        </View>
      </Card>

      {changes.length > 0 ? (
        <ListGroup header="По сравнению с прошлой неделей">
          {changes.map((change) => (
            <ChangeRow key={change.id} change={change} />
          ))}
        </ListGroup>
      ) : null}
    </>
  );
}

function MetricTile({
  icon,
  color,
  label,
  value,
  unit,
  change,
  caption,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: number;
  unit: string;
  change?: ReportChange;
  caption?: string;
}) {
  const { colors } = useThemeColors();
  const delta =
    change && change.direction !== "same"
      ? `${change.delta > 0 ? "+" : "−"}${Math.abs(change.delta)} к прошлой неделе`
      : null;
  return (
    <View
      className="min-w-[45%] flex-1 gap-1 rounded-card bg-card p-4 dark:bg-ink-900"
      accessible
      accessibilityLabel={`${label}: ${value} ${unit}${delta ? `, ${delta}` : ""}${caption ? `, ${caption}` : ""}`}
    >
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={16} color={color} />
        <AppText variant="label" className="text-[14px]" style={{ color }} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <View className="flex-row items-baseline gap-1">
        <AppText rounded className="text-[32px] font-bold leading-[38px]">
          {value}
        </AppText>
        <AppText variant="caption" tone="muted" className="font-semibold" numberOfLines={1}>
          {unit}
        </AppText>
      </View>
      {delta ? (
        <AppText
          variant="caption"
          className="text-[12px] font-semibold"
          style={{ color: change!.direction === "better" ? colors.success : colors.warningStrong }}
        >
          {delta}
        </AppText>
      ) : caption ? (
        <AppText variant="caption" tone="subtle" className="text-[12px]">
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

const CHANGE_LABELS: Record<ReportChange["id"], { title: string; icon: IconName }> = {
  saved: { title: "Спасено", icon: "leaf" },
  slips: { title: "Срывы", icon: "alert-circle" },
  success: { title: "Удержались", icon: "pulse" },
  scroll: { title: "Лента в день", icon: "phone-portrait" },
};

function ChangeRow({ change }: { change: ReportChange }) {
  const { colors } = useThemeColors();
  const { title, icon } = CHANGE_LABELS[change.id];
  const sign = change.delta > 0 ? "+" : change.delta < 0 ? "−" : "";
  const amount = Math.abs(change.delta);
  const value =
    change.id === "saved" || change.id === "scroll"
      ? `${sign}${formatMinutes(amount)}`
      : change.id === "success"
        ? `${sign}${amount}%`
        : `${sign}${amount}`;
  const color =
    change.direction === "better"
      ? colors.success
      : change.direction === "worse"
        ? colors.warningStrong
        : colors.textSubtle;
  return (
    <ListRow
      icon={icon}
      iconColor={color}
      title={title}
      right={
        <View className="flex-row items-center gap-1">
          <Ionicons
            name={change.delta > 0 ? "arrow-up" : change.delta < 0 ? "arrow-down" : "remove"}
            size={14}
            color={color}
          />
          <AppText variant="label" style={{ color }}>
            {change.direction === "same" ? "Без изменений" : value}
          </AppText>
        </View>
      }
    />
  );
}
