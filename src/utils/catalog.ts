import { m, type Messages, type PluralForms } from "../i18n";
import type {
  ExerciseId,
  FeedApp,
  IconName,
  Replacement,
  ReplacementCategory,
  TimeOfDay,
  TriggerId,
} from "./types";

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

export type TriggerTone = "amber" | "sky" | "rose" | "violet" | "teal" | "slate";

export interface TriggerOption {
  id: TriggerId;
  label: string;
  icon: IconName;
  /** Shown under the label on the quick cards. */
  hint: string;
  /** The answer as it reads in the coach's "Что произошло?" after a slip. */
  ask: string;
  /** The cause as a noun inside the coach's sentences: "основная причина — усталость". */
  noun: string;
  /** The cause after a slip in the coach's sentences: "срывы чаще всего из-за усталости". */
  because: string;
  tone: TriggerTone;
  /** Completes "Чаще всего срывы случаются по вечерам …". */
  reason: string;
  advice: string;
}

/** A trigger whose texts are read from the current language's messages on every access. */
function defineTrigger(id: TriggerId, icon: IconName, tone: TriggerTone): TriggerOption {
  const text = () => m().catalog.triggers[id];
  return {
    id,
    icon,
    tone,
    get label() {
      return text().label;
    },
    get hint() {
      return text().hint;
    },
    get ask() {
      return text().ask;
    },
    get noun() {
      return text().noun;
    },
    get because() {
      return text().because;
    },
    get reason() {
      return text().reason;
    },
    get advice() {
      return text().advice;
    },
  };
}

export const TRIGGERS: readonly TriggerOption[] = [
  defineTrigger("boredom", "hourglass-outline", "amber"),
  defineTrigger("fatigue", "battery-dead-outline", "sky"),
  defineTrigger("stress", "thunderstorm-outline", "rose"),
  defineTrigger("loneliness", "person-outline", "violet"),
  defineTrigger("procrastination", "time-outline", "teal"),
  defineTrigger("autopilot", "repeat-outline", "slate"),
  defineTrigger("relax", "cafe-outline", "teal"),
  defineTrigger("sleepless", "moon-outline", "violet"),
  defineTrigger("other", "ellipsis-horizontal-circle-outline", "slate"),
];

/** Order of the answers in the coach's "Что произошло?" after a slip. */
export const REFLECTION_TRIGGERS: readonly TriggerId[] = [
  "boredom",
  "fatigue",
  "relax",
  "sleepless",
  "autopilot",
  "stress",
  "loneliness",
  "procrastination",
  "other",
];

export function getTrigger(id: TriggerId): TriggerOption {
  return TRIGGERS.find((trigger) => trigger.id === id) ?? TRIGGERS[0]!;
}

// ---------------------------------------------------------------------------
// Feed apps
// ---------------------------------------------------------------------------

export const FEED_APPS: readonly { id: FeedApp; label: string; icon: IconName }[] = [
  { id: "tiktok", label: "TikTok", icon: "logo-tiktok" },
  { id: "reels", label: "Reels", icon: "logo-instagram" },
  { id: "shorts", label: "Shorts", icon: "logo-youtube" },
  {
    id: "other",
    icon: "phone-portrait-outline",
    get label() {
      return m().catalog.feedApps.other;
    },
  },
];

export function getFeedApp(id: FeedApp) {
  return FEED_APPS.find((app) => app.id === id) ?? FEED_APPS[FEED_APPS.length - 1]!;
}

// ---------------------------------------------------------------------------
// Micro-replacements
// ---------------------------------------------------------------------------

function defineCategory(id: ReplacementCategory, icon: IconName) {
  return {
    id,
    icon,
    get label() {
      return m().catalog.categories[id].label;
    },
    get description() {
      return m().catalog.categories[id].description;
    },
  };
}

export const CATEGORIES: readonly {
  id: ReplacementCategory;
  label: string;
  icon: IconName;
  description: string;
}[] = [
  defineCategory("body", "body-outline"),
  defineCategory("mind", "bulb-outline"),
  defineCategory("facts", "library-outline"),
];

export function getCategory(id: ReplacementCategory) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0]!;
}

type ItemId = keyof Messages["catalog"]["items"];

/** A built-in replacement; its title, description and steps come from the current language. */
function defineReplacement(
  data: Omit<Replacement, "id" | "title" | "description" | "steps"> & { id: ItemId },
): Replacement {
  const text = () => m().catalog.items[data.id];
  // Never a spread in the same literal as the getters: compiled for React Native (Hermes) such a
  // spread reads every getter once, freezing the language the app started in.
  return Object.defineProperties({ ...data } as Replacement, {
    title: { get: () => text().title, enumerable: true },
    description: { get: () => text().description, enumerable: true },
    steps: { get: () => text().steps, enumerable: true },
  });
}

export const REPLACEMENTS: readonly Replacement[] = [
  // --- Body -----------------------------------------------------------------
  defineReplacement({
    id: "squats",
    minutes: 1,
    category: "body",
    icon: "fitness-outline",
    triggers: ["boredom", "fatigue", "procrastination"],
  }),
  defineReplacement({
    id: "neck-shoulders",
    minutes: 2,
    category: "body",
    icon: "accessibility-outline",
    triggers: ["fatigue", "stress", "relax"],
  }),
  defineReplacement({
    id: "eyes-20-20",
    minutes: 1,
    category: "body",
    icon: "eye-outline",
    triggers: ["fatigue", "autopilot"],
  }),
  defineReplacement({
    id: "cold-water",
    minutes: 1,
    category: "body",
    icon: "water-outline",
    triggers: ["stress", "fatigue", "autopilot"],
  }),
  defineReplacement({
    id: "walk-3",
    minutes: 3,
    category: "body",
    icon: "walk-outline",
    triggers: ["boredom", "autopilot", "procrastination"],
  }),
  defineReplacement({
    id: "tidy-surface",
    minutes: 3,
    category: "body",
    icon: "color-wand-outline",
    triggers: ["procrastination", "boredom"],
  }),
  defineReplacement({
    id: "plank",
    minutes: 1,
    category: "body",
    icon: "barbell-outline",
    premium: true,
    triggers: ["stress", "boredom"],
  }),
  defineReplacement({
    id: "shake-off",
    minutes: 1,
    category: "body",
    icon: "pulse-outline",
    premium: true,
    triggers: ["stress"],
  }),
  defineReplacement({
    id: "muscle-relax",
    minutes: 3,
    category: "body",
    icon: "bed-outline",
    premium: true,
    triggers: ["stress", "fatigue", "relax", "sleepless"],
  }),

  // --- Mind -----------------------------------------------------------------
  defineReplacement({
    id: "serial-sevens",
    minutes: 1,
    category: "mind",
    icon: "calculator-outline",
    triggers: ["autopilot", "boredom"],
  }),
  defineReplacement({
    id: "two-minute-step",
    minutes: 2,
    category: "mind",
    icon: "rocket-outline",
    triggers: ["procrastination"],
  }),
  defineReplacement({
    id: "gratitude",
    minutes: 2,
    category: "mind",
    icon: "heart-outline",
    triggers: ["loneliness", "stress", "relax"],
  }),
  defineReplacement({
    id: "message-human",
    minutes: 2,
    category: "mind",
    icon: "chatbubbles-outline",
    triggers: ["loneliness", "boredom"],
  }),
  defineReplacement({
    id: "brain-dump",
    minutes: 2,
    category: "mind",
    icon: "create-outline",
    premium: true,
    triggers: ["stress", "procrastination", "sleepless"],
  }),
  defineReplacement({
    id: "alphabet-game",
    minutes: 3,
    category: "mind",
    icon: "text-outline",
    premium: true,
    triggers: ["boredom", "autopilot"],
  }),
  defineReplacement({
    id: "evening-plan",
    minutes: 2,
    category: "mind",
    icon: "sparkles-outline",
    premium: true,
    triggers: ["fatigue", "procrastination", "sleepless"],
  }),

  // --- Facts ----------------------------------------------------------------
  defineReplacement({
    id: "facts-brain",
    minutes: 1,
    category: "facts",
    icon: "git-network-outline",
    triggers: ["boredom", "autopilot"],
  }),
  defineReplacement({
    id: "facts-nature",
    minutes: 1,
    category: "facts",
    icon: "leaf-outline",
    triggers: ["boredom", "stress"],
  }),
  defineReplacement({
    id: "facts-space",
    minutes: 1,
    category: "facts",
    icon: "planet-outline",
    premium: true,
    triggers: ["boredom", "loneliness"],
  }),
  defineReplacement({
    id: "facts-history",
    minutes: 1,
    category: "facts",
    icon: "school-outline",
    premium: true,
    triggers: ["boredom", "procrastination"],
  }),
];

export const CATEGORY_ICONS: Record<ReplacementCategory, IconName> = {
  body: "body-outline",
  mind: "bulb-outline",
  facts: "library-outline",
};

// ---------------------------------------------------------------------------
// SOS: the 15-second pause
// ---------------------------------------------------------------------------

export const INTERCEPT_SECONDS = 15;

export interface BreathPhase {
  label: string;
  seconds: number;
  /** Target scale of the breathing circle at the end of the phase. */
  scale: number;
}

export interface Exercise {
  id: ExerciseId;
  title: string;
  subtitle: string;
  icon: IconName;
  premium?: boolean;
  /** Breathing cycle that repeats for the whole pause. */
  breath: readonly BreathPhase[];
  /** Grounding prompts; their seconds add up to INTERCEPT_SECONDS. */
  prompts: readonly { text: string; seconds: number }[];
}

type BreathId = keyof Messages["catalog"]["breath"];

/** A breathing phase whose label is read in the current language. */
function breathPhase(id: BreathId, seconds: number, scale: number): BreathPhase {
  return {
    seconds,
    scale,
    get label() {
      return m().catalog.breath[id];
    },
  };
}

const SLOW_BREATH: readonly BreathPhase[] = [
  breathPhase("inhale", 2, 1),
  breathPhase("exhale", 3, 0.6),
];

/**
 * An SOS exercise; its title, subtitle and prompts come from the current language. `prompts`
 * gives the seconds of each prompt, in the order of the messages' prompts.
 */
function defineExercise(
  data: Omit<Exercise, "title" | "subtitle" | "prompts"> & { prompts: readonly number[] },
): Exercise {
  const text = () => m().catalog.exercises[data.id];
  // No spread next to the getters (see defineReplacement).
  return Object.defineProperties(
    {
      ...data,
      prompts: data.prompts.map((seconds, index) => ({
        seconds,
        get text() {
          return text().prompts[index] ?? "";
        },
      })),
    } as unknown as Exercise,
    {
      title: { get: () => text().title, enumerable: true },
      subtitle: { get: () => text().subtitle, enumerable: true },
    },
  );
}

export const EXERCISES: readonly Exercise[] = [
  defineExercise({
    id: "breath-ground",
    icon: "leaf-outline",
    breath: SLOW_BREATH,
    prompts: [5, 5, 5],
  }),
  defineExercise({
    id: "box-breath",
    icon: "square-outline",
    premium: true,
    breath: [
      breathPhase("inhale", 4, 1),
      breathPhase("hold", 4, 1),
      breathPhase("exhale", 4, 0.6),
      breathPhase("rest", 3, 0.6),
    ],
    prompts: [4, 4, 4, 3],
  }),
  defineExercise({
    id: "serial-sevens",
    icon: "calculator-outline",
    premium: true,
    breath: SLOW_BREATH,
    prompts: [5, 5, 5],
  }),
  defineExercise({
    id: "intent-check",
    icon: "help-circle-outline",
    premium: true,
    breath: SLOW_BREATH,
    prompts: [5, 5, 5],
  }),
];

export function getExercise(id: ExerciseId): Exercise {
  return EXERCISES.find((exercise) => exercise.id === id) ?? EXERCISES[0]!;
}

// ---------------------------------------------------------------------------
// Saved time → tangible equivalents
// ---------------------------------------------------------------------------

export interface Equivalent {
  id: string;
  icon: IconName;
  /** Minutes that make up one unit. */
  unitMinutes: number;
  /** The word after the number in the current language: countOf(2, unit) → "2 книги". */
  unit: PluralForms;
  /**
   * The same words as a triple for `formatQuantity`: [one, few, many] in Russian,
   * [singular, plural, plural] in the other languages.
   */
  forms: readonly [string, string, string];
  caption: string;
  premium?: boolean;
}

type EquivalentId = keyof Messages["catalog"]["equivalents"];

/** A saved-time equivalent whose words and caption are read in the current language. */
function defineEquivalent(
  id: EquivalentId,
  icon: IconName,
  unitMinutes: number,
  premium?: boolean,
): Equivalent {
  const text = () => m().catalog.equivalents[id];
  // No spread next to the getters (see defineReplacement).
  return {
    id,
    icon,
    unitMinutes,
    premium: premium === true ? true : undefined,
    get unit() {
      return text().unit;
    },
    get forms() {
      const unit: PluralForms = text().unit;
      return [unit.one, unit.few ?? unit.other, unit.many ?? unit.other] as const;
    },
    get caption() {
      return text().caption;
    },
  };
}

export const EQUIVALENTS: readonly Equivalent[] = [
  defineEquivalent("books", "book-outline", 300),
  defineEquivalent("sleep", "moon-outline", 60),
  defineEquivalent("walks", "walk-outline", 30),
  defineEquivalent("workouts", "barbell-outline", 45, true),
  defineEquivalent("language", "language-outline", 20, true),
  defineEquivalent("calls", "call-outline", 15, true),
];

/** A part of the day: `label` names it, `phrase` is the adverb of time used in sentences. */
function defineTimeOfDay(id: TimeOfDay): { label: string; phrase: string } {
  return {
    get label() {
      return m().catalog.timeOfDay[id].label;
    },
    get phrase() {
      return m().catalog.timeOfDay[id].phrase;
    },
  };
}

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, { label: string; phrase: string }> = {
  morning: defineTimeOfDay("morning"),
  afternoon: defineTimeOfDay("afternoon"),
  evening: defineTimeOfDay("evening"),
  night: defineTimeOfDay("night"),
};

/** Preset values for the scroll-time logger and onboarding. */
export const SCROLL_PRESETS = [30, 60, 120, 180] as const;
/** A whole day: the only real upper bound for minutes in the feed. */
export const MAX_SCROLL_MINUTES = 24 * 60;
