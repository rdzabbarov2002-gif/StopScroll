import {
  FlexWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
  type HexColor,
  type WidgetRepresentation,
} from "react-native-android-widget";

import { pluralize } from "../utils/date";
import { palette } from "../utils/theme";
import { widgetDay, widgetReplacement, type WidgetSnapshot } from "./snapshot";

/** Names match the widgets declared for the react-native-android-widget plugin in app.json. */
export const ANDROID_WIDGETS = ["Today", "Streak", "Limit", "DayRing", "Replacement"] as const;
export type AndroidWidgetName = (typeof ANDROID_WIDGETS)[number];

const isWidgetName = (name: string): name is AndroidWidgetName =>
  (ANDROID_WIDGETS as readonly string[]).includes(name);

interface WidgetColors {
  card: HexColor;
  text: HexColor;
  muted: HexColor;
  track: HexColor;
  brand: HexColor;
  success: HexColor;
  warning: HexColor;
  indigo: HexColor;
}

const hex = (value: string) => value as HexColor;

/** The app's own palette: white cards on light, the dark card grey on dark. */
function widgetColors(dark: boolean): WidgetColors {
  const theme = dark ? palette.dark : palette.light;
  return {
    card: hex(dark ? theme.surface : theme.background),
    text: hex(theme.text),
    muted: hex(theme.textMuted),
    track: hex(theme.ringTrack),
    brand: hex(theme.primary),
    success: hex(theme.success),
    warning: hex(theme.warningStrong),
    indigo: hex(theme.indigo),
  };
}

function durationParts(minutes: number): { value: string; unit: string }[] {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return [{ value: String(rest), unit: "мин" }];
  if (rest === 0) return [{ value: String(hours), unit: "ч" }];
  return [
    { value: String(hours), unit: "ч" },
    { value: String(rest), unit: "мин" },
  ];
}

const durationText = (minutes: number) =>
  durationParts(minutes)
    .map((part) => `${part.value} ${part.unit}`)
    .join(" ");

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function Card({
  colors,
  uri,
  label,
  children,
}: {
  colors: WidgetColors;
  uri: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      accessibilityLabel={label}
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 14,
      }}
    >
      {children}
    </FlexWidget>
  );
}

/** "● Спасено" — the colored label of a Health-style card. */
function Label({ text, color }: { text: string; color: HexColor }) {
  return (
    <FlexWidget style={{ flexDirection: "row", alignItems: "center", flexGap: 6 }}>
      <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <TextWidget text={text} style={{ fontSize: 13, fontWeight: "700", color }} maxLines={1} />
    </FlexWidget>
  );
}

function Big({ parts, color }: { parts: { value: string; unit: string }[]; color: HexColor }) {
  return (
    <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end", flexGap: 3 }}>
      {parts.flatMap((part) => [
        <TextWidget
          key={`${part.unit}-value`}
          text={part.value}
          style={{ fontSize: 32, fontWeight: "700", color }}
          maxLines={1}
        />,
        <TextWidget
          key={`${part.unit}-unit`}
          text={part.unit}
          style={{ fontSize: 15, fontWeight: "700", color, marginBottom: 5 }}
          maxLines={1}
        />,
      ])}
    </FlexWidget>
  );
}

function Caption({
  text,
  colors,
  size = 12,
}: {
  text: string;
  colors: WidgetColors;
  size?: number;
}) {
  return (
    <TextWidget
      text={text}
      style={{ fontSize: size, color: colors.muted }}
      maxLines={1}
      truncate="END"
    />
  );
}

function Empty({ colors }: { colors: WidgetColors }) {
  return (
    <Card colors={colors} uri="stopscroll://home" label="StopScroll">
      <Label text="StopScroll" color={colors.brand} />
      <TextWidget
        text="Откройте StopScroll, чтобы здесь появились ваши цифры."
        style={{ fontSize: 13, color: colors.muted }}
        maxLines={3}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// The widgets
// ---------------------------------------------------------------------------

function TodayWidget({ snapshot, now, colors }: WidgetProps) {
  const day = widgetDay(snapshot, now);
  return (
    <Card
      colors={colors}
      uri="stopscroll://home"
      label={`Сегодня спасено ${durationText(day.saved)}`}
    >
      <Label text="Спасено" color={colors.success} />
      <FlexWidget style={{ flexDirection: "column", flexGap: 1 }}>
        <Caption text="Сегодня" colors={colors} size={13} />
        <Big parts={durationParts(day.saved)} color={colors.success} />
        <Caption
          text={
            day.wins > 0
              ? `${day.wins} ${pluralize(day.wins, ["победа", "победы", "побед"])} над лентой`
              : "Пауза вернёт время"
          }
          colors={colors}
        />
      </FlexWidget>
    </Card>
  );
}

function StreakWidget({ snapshot, now, colors }: WidgetProps) {
  const { streak } = widgetDay(snapshot, now);
  return (
    <Card colors={colors} uri="stopscroll://stats" label={`Серия ${streak}`}>
      <Label text="Серия" color={colors.warning} />
      <FlexWidget style={{ flexDirection: "column", flexGap: 1 }}>
        <Big
          parts={[{ value: String(streak), unit: pluralize(streak, ["день", "дня", "дней"]) }]}
          color={colors.warning}
        />
        <Caption
          text={streak > 0 ? "в пределах лимита" : "Начните серию сегодня"}
          colors={colors}
        />
      </FlexWidget>
    </Card>
  );
}

function LimitWidget({ snapshot, now, colors }: WidgetProps) {
  const day = widgetDay(snapshot, now);
  const left = day.scrolled === null ? null : day.limit - day.scrolled;
  const color = left !== null && left < 0 ? colors.warning : colors.brand;
  return (
    <Card
      colors={colors}
      uri="stopscroll://stats"
      label={
        left === null
          ? "Лимит: время не отмечено"
          : `Лимит: осталось ${durationText(Math.max(0, left))}`
      }
    >
      <Label text="Лимит" color={color} />
      <FlexWidget style={{ flexDirection: "column", flexGap: 1 }}>
        <Caption
          text={left === null ? "Сегодня" : left >= 0 ? "Осталось" : "Сверх лимита"}
          colors={colors}
          size={13}
        />
        <Big parts={durationParts(left === null ? day.limit : Math.abs(left))} color={color} />
        <Caption
          text={
            left === null ? "Отметьте время за сегодня" : `из ${durationText(day.limit)} на сегодня`
          }
          colors={colors}
        />
      </FlexWidget>
    </Card>
  );
}

const RING_SIZE = 92;
const RING_STROKE = 10;

function ringSvg(progress: number, color: HexColor, track: HexColor): string {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = RING_SIZE / 2;
  const arc =
    progress > 0
      ? `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${RING_STROKE}" stroke-linecap="round" stroke-dasharray="${(circumference * progress).toFixed(2)} ${circumference.toFixed(2)}" transform="rotate(-90 ${center} ${center})"/>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${RING_SIZE}" height="${RING_SIZE}" viewBox="0 0 ${RING_SIZE} ${RING_SIZE}"><circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${track}" stroke-width="${RING_STROKE}"/>${arc}</svg>`;
}

function DayRingWidget({ snapshot, now, colors }: WidgetProps) {
  const day = widgetDay(snapshot, now);
  const used = day.scrolled ?? 0;
  const progress = day.limit > 0 ? Math.min(1, used / day.limit) : used > 0 ? 1 : 0;
  const over = used > day.limit;
  const color = over ? colors.warning : colors.brand;
  return (
    <Card
      colors={colors}
      uri="stopscroll://stats"
      label={`Лента сегодня: ${day.scrolled === null ? "не отмечено" : durationText(used)} из ${durationText(day.limit)}`}
    >
      <FlexWidget style={{ width: "match_parent", alignItems: "center" }}>
        <OverlapWidget style={{ width: RING_SIZE, height: RING_SIZE }}>
          <SvgWidget
            svg={ringSvg(progress, color, colors.track)}
            style={{ width: RING_SIZE, height: RING_SIZE }}
          />
          <FlexWidget
            style={{
              width: RING_SIZE,
              height: RING_SIZE,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <TextWidget
              text={day.scrolled === null ? "—" : durationText(used)}
              style={{ fontSize: 15, fontWeight: "700", color: colors.text }}
              maxLines={1}
            />
            <TextWidget
              text={`из ${durationText(day.limit)}`}
              style={{ fontSize: 10, color: colors.muted }}
              maxLines={1}
            />
          </FlexWidget>
        </OverlapWidget>
      </FlexWidget>
      <FlexWidget style={{ width: "match_parent", alignItems: "center" }}>
        <TextWidget
          text={
            day.scrolled === null ? "Отметьте время" : over ? "Лимит превышен" : "Лента сегодня"
          }
          style={{ fontSize: 12, fontWeight: "700", color: over ? colors.warning : colors.muted }}
          maxLines={1}
        />
      </FlexWidget>
    </Card>
  );
}

function ReplacementWidget({ snapshot, now, colors }: WidgetProps) {
  const item = widgetReplacement(snapshot, now);
  if (!item) return <Empty colors={colors} />;
  return (
    <Card
      colors={colors}
      uri={`stopscroll://replacement/${encodeURIComponent(item.id)}`}
      label={`Вместо ленты: ${item.title}`}
    >
      <Label text="Вместо ленты" color={colors.indigo} />
      <FlexWidget style={{ flexDirection: "column", flexGap: 2, width: "match_parent" }}>
        <TextWidget
          text={item.title}
          style={{ fontSize: 18, fontWeight: "700", color: colors.text }}
          maxLines={2}
          truncate="END"
        />
        <Caption text={`${item.minutes} мин · новая каждые полчаса`} colors={colors} />
      </FlexWidget>
    </Card>
  );
}

interface WidgetProps {
  snapshot: WidgetSnapshot;
  now: number;
  colors: WidgetColors;
}

const WIDGETS: Record<AndroidWidgetName, (props: WidgetProps) => React.JSX.Element> = {
  Today: TodayWidget,
  Streak: StreakWidget,
  Limit: LimitWidget,
  DayRing: DayRingWidget,
  Replacement: ReplacementWidget,
};

/** Light and dark versions; Android picks the one matching the system theme. */
export function renderAndroidWidget(
  name: string,
  snapshot: WidgetSnapshot | null,
  now: number,
): WidgetRepresentation {
  const render = (dark: boolean) => {
    const colors = widgetColors(dark);
    if (!snapshot || !isWidgetName(name)) return <Empty colors={colors} />;
    const Widget = WIDGETS[name];
    return <Widget snapshot={snapshot} now={now} colors={colors} />;
  };
  return { light: render(false), dark: render(true) };
}
