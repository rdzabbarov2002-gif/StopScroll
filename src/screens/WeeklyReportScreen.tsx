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
import { plural, useT } from "../i18n";
import type { RootStackScreenProps } from "../navigation/types";
import { getTrigger } from "../utils/catalog";
import {
  WEEKDAYS_SHORT,
  addDays,
  formatHourRange,
  formatMinutes,
  formatMinutesCompact,
  formatMinutesInline,
  formatWeekRange,
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

export function WeeklyReportScreen({ route }: RootStackScreenProps<"WeeklyReport">) {
  const app = useApp();
  const t = useT().report;
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
      <BackButton label={t.back} />
      <View className="flex-row items-end justify-between gap-3 px-1 pb-1">
        <View className="flex-1">
          <AppText variant="overline" tone="subtle">
            {formatWeekRange(week)}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {t.title}
          </AppText>
        </View>
        {weeks.length > 1 ? (
          <View className="mb-1 flex-row gap-2">
            <IconButton
              icon="chevron-back"
              onPress={() => older && setWeek(older)}
              accessibilityLabel={t.olderWeek}
              className={older ? "" : "opacity-30"}
            />
            <IconButton
              icon="chevron-forward"
              onPress={() => newer && setWeek(newer)}
              accessibilityLabel={t.newerWeek}
              className={newer ? "" : "opacity-30"}
            />
          </View>
        ) : null}
      </View>

      {weeks.length === 0 ? (
        <EmptyState icon="calendar-outline" title={t.firstReport.title} text={t.firstReport.text} />
      ) : isEmptyReport(report) ? (
        <EmptyState icon="leaf-outline" title={t.quietWeek.title} text={t.quietWeek.text} />
      ) : (
        <ReportBody report={report} previous={hasPrevious ? previous : null} />
      )}

      {review ? <WeeklyReviewCard sections={review} /> : null}
    </Screen>
  );
}

function ReportBody({ report, previous }: { report: WeeklyReport; previous: WeeklyReport | null }) {
  const { colors, chart } = useThemeColors();
  const t = useT().report;
  const app = useApp();
  const limit = app.settings.dailyLimitMinutes;
  const changes = previous ? compareReports(report, previous) : [];
  const savedChange = changes.find((change) => change.id === "saved");
  const impulses = report.wins + report.slips;

  const savedData: ColumnDatum[] = report.days.map((day, index) => ({
    key: day.key,
    value: day.saved,
    label: WEEKDAYS_SHORT[index],
    a11y: t.daySaved(WEEKDAYS_SHORT[index], formatMinutes(day.saved)),
  }));
  const scrollData: ColumnDatum[] = report.days.map((day, index) => ({
    key: day.key,
    value: day.scroll,
    label: WEEKDAYS_SHORT[index],
    a11y: t.dayScroll(
      WEEKDAYS_SHORT[index],
      day.scroll === null ? null : formatMinutes(day.scroll),
    ),
  }));
  const bestDay = report.days.reduce<number | null>(
    (best, day, index) =>
      day.saved > 0 && (best === null || day.saved > report.days[best]!.saved) ? index : best,
    null,
  );

  return (
    <>
      <Card>
        <CardLabel icon="leaf" label={t.saved.label} color={colors.success} />
        <AppText variant="statement" className="mt-2">
          {savedChange && savedChange.delta !== 0
            ? t.saved.change(
                formatMinutesInline(Math.abs(savedChange.delta)),
                savedChange.delta > 0,
              )
            : report.savedMinutes > 0
              ? t.saved.total(formatMinutesInline(report.savedMinutes))
              : t.saved.none}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <DurationValue
            label={t.saved.week}
            minutes={report.savedMinutes}
            color={colors.success}
          />
          <KeyValue
            label={t.saved.wins}
            value={String(report.wins)}
            unit={plural(report.wins, t.units.wins)}
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
          label={t.metrics.inLimit}
          value={report.daysInLimit}
          unit={t.metrics.ofDays(report.loggedDays)}
        />
        <MetricTile
          icon="alert-circle"
          color={colors.warningStrong}
          label={t.metrics.slips}
          value={report.slips}
          unit={plural(report.slips, t.units.slips)}
          change={changes.find((change) => change.id === "slips")}
        />
        <MetricTile
          icon="sparkles"
          color={colors.indigo}
          label={t.metrics.replacements}
          value={report.replacements}
          unit={plural(report.replacements, t.units.replacements)}
        />
        <MetricTile
          icon="flame"
          color={colors.warning}
          label={t.metrics.streak}
          value={report.currentStreak}
          unit={plural(report.currentStreak, t.units.days)}
          caption={t.metrics.record(report.bestStreak)}
        />
      </View>

      <Card>
        <CardLabel icon="pulse" label={t.impulses.label} color={colors.successBright} />
        <View className="mt-3 flex-row items-center gap-5">
          <SuccessRing rate={report.successRate} />
          <View className="flex-1 gap-2">
            <AppText variant="statement">
              {report.successRate === null
                ? t.impulses.none
                : t.impulses.success(Math.round(report.successRate * 100))}
            </AppText>
            <AppText variant="caption" tone="muted">
              {t.impulses.breakdown(impulses, report.wins, report.slips)}
            </AppText>
          </View>
        </View>
        <Separator className="my-3.5" />
        <AppText variant="label" className="mb-2">
          {t.impulses.byTime}
        </AppText>
        <SlotsChart slots={report.slots} />
        <ChartLegend
          items={[
            { label: t.impulses.resisted, color: chart.series },
            { label: t.impulses.slips, color: chart.slip },
          ]}
        />
      </Card>

      <ListGroup header={t.hardest.header}>
        <ListRow
          icon="calendar"
          iconColor={colors.warningStrong}
          title={t.hardest.day}
          subtitle={
            report.hardestDay === null
              ? t.hardest.noData
              : report.hardestDay.basis === "slips"
                ? t.hardest.slips(report.hardestDay.value)
                : t.hardest.mostFeed(formatMinutes(report.hardestDay.value))
          }
          value={report.hardestDay ? weekdayName(report.hardestDay.index) : "—"}
        />
        <ListRow
          icon="time"
          iconColor={colors.indigo}
          title={t.hardest.hour}
          subtitle={
            report.hardestHour === null
              ? t.hardest.noData
              : report.hardestHour.basis === "slips"
                ? t.hardest.slips(report.hardestHour.count)
                : t.hardest.mostPull(report.hardestHour.count)
          }
          value={report.hardestHour ? formatHourRange(report.hardestHour.hour) : "—"}
        />
        <ListRow
          icon={report.topTrigger ? getTrigger(report.topTrigger.id).icon : "happy"}
          iconColor={colors.danger}
          title={t.hardest.trigger}
          subtitle={
            report.topTrigger
              ? t.hardest.triggerSlips(report.topTrigger.count, report.slips)
              : t.hardest.noSlips
          }
          value={report.topTrigger ? getTrigger(report.topTrigger.id).label : "—"}
        />
      </ListGroup>

      <Card>
        <CardLabel icon="phone-portrait" label={t.feed.label} color={colors.primary} />
        <AppText variant="statement" className="mt-2">
          {report.scrollAverage === null
            ? t.feed.none
            : t.feed.average(
                formatMinutesInline(report.scrollAverage),
                report.daysInLimit,
                report.loggedDays,
              )}
        </AppText>
        <View className="mt-4">
          <ColumnChart
            data={scrollData}
            reference={{ value: limit, label: t.feed.limit(formatMinutes(limit)) }}
            formatTick={formatMinutesCompact}
            plotHeight={110}
            colorFor={(datum) =>
              datum.value !== null && datum.value > limit ? chart.slip : chart.series
            }
          />
        </View>
      </Card>

      {changes.length > 0 ? (
        <ListGroup header={t.changes.header}>
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
  const t = useT().report;
  const delta =
    change && change.direction !== "same"
      ? t.metrics.vsLastWeek(`${change.delta > 0 ? "+" : "−"}${Math.abs(change.delta)}`)
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

const CHANGE_ICONS: Record<ReportChange["id"], IconName> = {
  saved: "leaf",
  slips: "alert-circle",
  success: "pulse",
  scroll: "phone-portrait",
};

function ChangeRow({ change }: { change: ReportChange }) {
  const { colors } = useThemeColors();
  const t = useT().report;
  const title = t.changes[change.id];
  const icon = CHANGE_ICONS[change.id];
  const sign = change.delta > 0 ? "+" : change.delta < 0 ? "−" : "";
  const amount = Math.abs(change.delta);
  const value =
    change.id === "saved" || change.id === "scroll"
      ? `${sign}${formatMinutes(amount)}`
      : change.id === "success"
        ? t.percent(amount, sign)
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
            {change.direction === "same" ? t.changes.same : value}
          </AppText>
        </View>
      }
    />
  );
}
