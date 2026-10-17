import { m } from "../i18n";
import type { ProFeature } from "../navigation/types";
import { EQUIVALENTS, EXERCISES, REPLACEMENTS } from "./catalog";
import type { IconName } from "./types";

/** Free vs Pro limits, kept in one place so screens and the paywall agree. */
export const FREE_TREND_DAYS = 7;
export const PRO_TREND_DAYS = 30;
export const FREE_HEATMAP_WEEKS = 6;
export const PRO_HEATMAP_WEEKS = 16;

const freeReplacements = REPLACEMENTS.filter((item) => !item.premium).length;
const freeExercises = EXERCISES.filter((item) => !item.premium).length;
const freeEquivalents = EQUIVALENTS.filter((item) => !item.premium).length;

export interface PlanRow {
  icon: IconName;
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

export const PLAN_ROWS: readonly PlanRow[] = [
  {
    icon: "pause-outline",
    get label() {
      return m().paywall.rows.sos;
    },
    free: true,
    pro: true,
  },
  {
    icon: "leaf-outline",
    get label() {
      return m().paywall.rows.exercises;
    },
    free: String(freeExercises),
    pro: String(EXERCISES.length),
  },
  {
    icon: "swap-horizontal-outline",
    get label() {
      return m().paywall.rows.replacements;
    },
    free: String(freeReplacements),
    get pro() {
      return m().paywall.rows.replacementsPro(REPLACEMENTS.length);
    },
  },
  {
    icon: "stats-chart-outline",
    get label() {
      return m().paywall.rows.trend;
    },
    get free() {
      return m().paywall.rows.days(FREE_TREND_DAYS);
    },
    get pro() {
      return m().paywall.rows.days(PRO_TREND_DAYS);
    },
  },
  {
    icon: "calendar-outline",
    get label() {
      return m().paywall.rows.heatmap;
    },
    get free() {
      return m().paywall.rows.weeks(FREE_HEATMAP_WEEKS);
    },
    get pro() {
      return m().paywall.rows.weeks(PRO_HEATMAP_WEEKS);
    },
  },
  {
    icon: "hourglass-outline",
    get label() {
      return m().paywall.rows.converter;
    },
    free: String(freeEquivalents),
    pro: String(EQUIVALENTS.length),
  },
  {
    icon: "analytics-outline",
    get label() {
      return m().paywall.rows.patterns;
    },
    free: false,
    pro: true,
  },
];

/** A paywall headline whose texts are read in the current language on access. */
const headline = (feature: ProFeature | "default") => ({
  get title() {
    return m().paywall.headlines[feature].title;
  },
  get text() {
    return m().paywall.headlines[feature].text;
  },
});

export const PAYWALL_HEADLINES: Record<ProFeature | "default", { title: string; text: string }> = {
  default: headline("default"),
  exercises: headline("exercises"),
  replacements: headline("replacements"),
  custom: headline("custom"),
  analytics: headline("analytics"),
  history: headline("history"),
  converter: headline("converter"),
};
