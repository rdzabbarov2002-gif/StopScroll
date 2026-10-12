import { useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";

export interface ColumnDatum {
  key: string;
  /** null = no data for this slot (drawn as a faint stub). */
  value: number | null;
  /** X-axis label; leave empty to skip a tick. */
  label?: string;
  /** Full description for screen readers, e.g. "Пн, 5 окт.: 1 ч 20 мин". */
  a11y: string;
}

interface ColumnChartProps {
  data: readonly ColumnDatum[];
  /** The emphasized column (accent hue); the rest use the de-emphasis step. */
  highlightKey?: string | null;
  onSelect?: (key: string) => void;
  /** Solid threshold line, e.g. the daily limit. */
  reference?: { value: number; label: string };
  /** Formats y-axis ticks. */
  formatTick: (value: number) => string;
  /** Candidate maxima for the y-axis; the first one that fits is used. */
  niceSteps?: readonly number[];
  plotHeight?: number;
  showYAxis?: boolean;
  /** Overrides a column's color, e.g. orange for days over the limit. */
  colorFor?: (datum: ColumnDatum, highlighted: boolean) => string | undefined;
}

const AXIS_BAND = 20;
const Y_GUTTER = 36;
const MAX_BAR = 26;
const RADIUS = 6;

const DEFAULT_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 50, 60, 80, 100, 150, 200];

function niceMax(value: number, steps: readonly number[]): number {
  return steps.find((step) => step >= value) ?? Math.ceil(value);
}

/** Column with a 4px rounded data end and a square base. */
function columnPath(x: number, width: number, top: number, base: number): string {
  const r = Math.min(RADIUS, width / 2, base - top);
  return [
    `M ${x} ${base}`,
    `L ${x} ${top + r}`,
    `Q ${x} ${top} ${x + r} ${top}`,
    `L ${x + width - r} ${top}`,
    `Q ${x + width} ${top} ${x + width} ${top + r}`,
    `L ${x + width} ${base}`,
    "Z",
  ].join(" ");
}

/**
 * Single-series column chart: thin columns from one baseline, hairline grid, one emphasized
 * column. Every column is a pressable target (the whole slot, not just the painted bar).
 */
export function ColumnChart({
  data,
  highlightKey,
  onSelect,
  reference,
  formatTick,
  niceSteps = DEFAULT_STEPS,
  plotHeight = 140,
  showYAxis = true,
  colorFor,
}: ColumnChartProps) {
  const { colors, chart } = useThemeColors();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const values = data.map((item) => item.value ?? 0);
  const top = niceMax(Math.max(1, ...values, reference ? reference.value * 1.15 : 0), niceSteps);
  const gutter = showYAxis ? Y_GUTTER : 0;
  const plotWidth = Math.max(0, width - gutter);
  const slot = data.length > 0 ? plotWidth / data.length : 0;
  const barWidth = Math.max(2, Math.min(MAX_BAR, slot * 0.62));
  const padTop = 12;
  const base = padTop + plotHeight;
  const y = (value: number) => base - (value / top) * plotHeight;
  const ticks = top % 2 === 0 ? [0, top / 2, top] : [0, top];

  return (
    <View className="gap-2">
      <View onLayout={onLayout} style={{ height: base + AXIS_BAND }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={base + AXIS_BAND}>
              {ticks.map((tick) => (
                <Line
                  key={`grid-${tick}`}
                  x1={gutter}
                  x2={width}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={tick === 0 ? chart.axis : chart.grid}
                  strokeWidth={1}
                />
              ))}
              {showYAxis
                ? ticks.map((tick) => (
                    <SvgText
                      key={`tick-${tick}`}
                      x={gutter - 6}
                      y={y(tick) + 3.5}
                      fontSize={11}
                      fill={colors.textSubtle}
                      textAnchor="end"
                    >
                      {formatTick(tick)}
                    </SvgText>
                  ))
                : null}

              {data.map((item, index) => {
                const x = gutter + index * slot + (slot - barWidth) / 2;
                if (item.value === null) {
                  return (
                    <Rect
                      key={item.key}
                      x={x}
                      y={base - 2}
                      width={barWidth}
                      height={2}
                      fill={chart.empty}
                    />
                  );
                }
                const highlighted = item.key === highlightKey;
                const fill =
                  colorFor?.(item, highlighted) ?? (highlighted ? chart.series : chart.seriesMuted);
                const barTop = Math.min(base - 2, y(item.value));
                return (
                  <Path key={item.key} d={columnPath(x, barWidth, barTop, base)} fill={fill} />
                );
              })}

              {reference ? (
                <>
                  <Line
                    x1={gutter}
                    x2={width}
                    y1={y(reference.value)}
                    y2={y(reference.value)}
                    stroke={chart.limit}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </>
              ) : null}

              {data.map((item, index) =>
                item.label ? (
                  <SvgText
                    key={`label-${item.key}`}
                    x={gutter + index * slot + slot / 2}
                    y={base + 15}
                    fontSize={11}
                    fill={item.key === highlightKey ? colors.text : colors.textMuted}
                    fontWeight={item.key === highlightKey ? "bold" : "normal"}
                    textAnchor="middle"
                  >
                    {item.label}
                  </SvgText>
                ) : null,
              )}
            </Svg>

            {onSelect ? (
              <View
                style={{
                  position: "absolute",
                  left: gutter,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  flexDirection: "row",
                }}
              >
                {data.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => onSelect(item.key)}
                    accessibilityRole="button"
                    accessibilityLabel={item.a11y}
                    accessibilityState={{ selected: item.key === highlightKey }}
                    style={{ flex: 1 }}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
      {reference ? (
        // Keyed legend instead of an in-plot label, so it never collides with a tall column.
        <View className="flex-row items-center gap-2 self-end">
          <View style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: chart.limit }} />
          <AppText
            variant="caption"
            className="text-[12px] font-semibold"
            style={{ color: chart.limit }}
          >
            {reference.label}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
