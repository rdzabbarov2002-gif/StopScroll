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
  { icon: "pause-outline", label: "SOS-пауза", free: true, pro: true },
  {
    icon: "leaf-outline",
    label: "Упражнения паузы",
    free: String(freeExercises),
    pro: String(EXERCISES.length),
  },
  {
    icon: "swap-horizontal-outline",
    label: "Замены",
    free: String(freeReplacements),
    pro: `${REPLACEMENTS.length} + свои`,
  },
  {
    icon: "stats-chart-outline",
    label: "Динамика",
    free: `${FREE_TREND_DAYS} дн.`,
    pro: `${PRO_TREND_DAYS} дн.`,
  },
  {
    icon: "calendar-outline",
    label: "Тепловая карта",
    free: `${FREE_HEATMAP_WEEKS} нед.`,
    pro: `${PRO_HEATMAP_WEEKS} нед.`,
  },
  {
    icon: "hourglass-outline",
    label: "Конвертер времени",
    free: String(freeEquivalents),
    pro: String(EQUIVALENTS.length),
  },
  { icon: "analytics-outline", label: "Закономерности", free: false, pro: true },
];

export const PAYWALL_HEADLINES: Record<ProFeature | "default", { title: string; text: string }> = {
  default: {
    title: "Верните себе время у алгоритмов",
    text: "Все упражнения, полный каталог замен, свои привычки и глубокая аналитика.",
  },
  exercises: {
    title: "Все упражнения для SOS-паузы",
    text: "Квадратное дыхание, счёт от 100 и честные вопросы — разные ключи к разным импульсам.",
  },
  replacements: {
    title: "Полный каталог микро-замен",
    text: "Больше движений, задач для ума и коротких фактов — здоровый дофамин на любой случай.",
  },
  custom: {
    title: "Свои замены и привычки",
    text: "Добавьте то, что работает именно для вас: гитара, отжимания, страница книги.",
  },
  analytics: {
    title: "Глубокая аналитика паттернов",
    text: "Узнайте, в какой час и в какой день недели лента побеждает чаще всего — и подготовьтесь заранее.",
  },
  history: {
    title: "Вся история прогресса",
    text: "Динамика за 30 дней и тепловая карта на 16 недель — видно, как меняется привычка.",
  },
  converter: {
    title: "Полный конвертер времени",
    text: "Тренировки, уроки языка и разговоры с близкими, которые вы выиграли у ленты.",
  },
};
