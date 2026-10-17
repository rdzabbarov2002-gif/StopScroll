import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";

import { useT } from "../../i18n";
import { useThemeColors } from "../../utils/theme";
import type { WeeklyReport } from "../../utils/weeklyReport";
import { AppText } from "../AppText";

/** A ring with the share of impulses that ended without the feed. */
export function SuccessRing({ rate, size = 104 }: { rate: number | null; size?: number }) {
  const { colors, chart } = useThemeColors();
  const t = useT().report;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = rate ?? 0;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={rate === null ? chart.empty : chart.slip}
          strokeWidth={stroke}
          fill="none"
        />
        {share > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.successBright}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * share} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <AppText rounded className="text-[26px] font-bold leading-[30px]">
        {rate === null ? "—" : t.percent(Math.round(share * 100))}
      </AppText>
    </View>
  );
}

const SLOT_LABELS = ["0", "3", "6", "9", "12", "15", "18", "21"];

/**
 * Impulses per 3-hour slot of the day: resisted (blue) next to lost (orange). Shows when the
 * urge comes and when it wins.
 */
export function SlotsChart({ slots }: { slots: WeeklyReport["slots"] }) {
  const { colors, chart } = useThemeColors();
  const t = useT().report;
  const [width, setWidth] = useState(0);
  const height = 110;
  const base = height - 4;
  const max = Math.max(1, ...slots.map((slot) => Math.max(slot.resisted, slot.lost)));
  const slotWidth = width / slots.length;
  const bar = Math.max(3, Math.min(12, slotWidth * 0.26));

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: height + 20 }}
      accessible
      accessibilityLabel={slots
        .map((slot) => t.impulses.slot(slot.hour, slot.hour + 3, slot.resisted, slot.lost))
        .join("; ")}
    >
      {width > 0 ? (
        <Svg width={width} height={height + 20}>
          <Line x1={0} x2={width} y1={base} y2={base} stroke={chart.axis} strokeWidth={1} />
          {slots.map((slot, index) => {
            const center = index * slotWidth + slotWidth / 2;
            const resisted = (slot.resisted / max) * (base - 8);
            const lost = (slot.lost / max) * (base - 8);
            return (
              <G key={slot.hour}>
                {slot.resisted > 0 ? (
                  <Rect
                    x={center - bar - 1}
                    y={base - resisted}
                    width={bar}
                    height={resisted}
                    rx={Math.min(4, bar / 2)}
                    fill={chart.series}
                  />
                ) : null}
                {slot.lost > 0 ? (
                  <Rect
                    x={center + 1}
                    y={base - lost}
                    width={bar}
                    height={lost}
                    rx={Math.min(4, bar / 2)}
                    fill={chart.slip}
                  />
                ) : null}
                <SvgText
                  x={center}
                  y={base + 15}
                  fontSize={11}
                  fill={colors.textMuted}
                  textAnchor="middle"
                >
                  {SLOT_LABELS[index]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

/** "● Удержались  ● Срывы" */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <View key={item.label} className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <AppText variant="caption" tone="muted" className="text-[13px]">
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
