/**
 * JSON Schemas for OpenAI Structured Outputs (strict mode): every property is required,
 * optional values are nullable, no additional properties. List lengths are capped with
 * maxItems — every output token is paid for. The app validates the same shapes again on its
 * side, so a malformed answer never reaches the screen.
 */

const str = { type: "string" } as const;
const nullableStr = { type: ["string", "null"] } as const;
const strings = (maxItems: number) => ({ type: "array", items: str, maxItems }) as const;
const nullableHour = { type: ["integer", "null"], minimum: 0, maximum: 23 } as const;

const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const list = (item: Record<string, unknown>, maxItems: number) => ({
  type: "array",
  items: object(item),
  maxItems,
});

const titled = (maxItems: number) => list({ title: str, note: str }, maxItems);

export const ENTRY_SCHEMA = object({
  results: list(
    {
      n: { type: "integer" },
      enough: { type: "boolean" },
      cause: { ...nullableStr, description: "2–6 слов" },
      emotion: { ...nullableStr, description: "1–4 слова" },
      context: { ...nullableStr, description: "где, когда, после чего" },
      behavior: {
        ...nullableStr,
        description:
          "например: автоматическое открытие, бегство от эмоции, отдых, откладывание дела",
      },
      insight: nullableStr,
      missing: nullableStr,
      tags: strings(3),
      gist: str,
      votes: list({ id: str, effect: { type: "string", enum: ["support", "against"] } }, 6),
    },
    5,
  ),
});

const PART_OF_DAY = { type: "string", enum: ["morning", "day", "evening", "night", "any"] };

export const DEEP_SCHEMA = object({
  profile: str,
  triggers: titled(5),
  emotions: titled(4),
  dangerZones: list(
    {
      title: str,
      note: str,
      weekday: { type: ["integer", "null"], minimum: 0, maximum: 6 },
      from: nullableHour,
      to: nullableHour,
    },
    4,
  ),
  strengths: strings(3),
  weaknesses: strings(3),
  tips: list({ text: str, when: PART_OF_DAY }, 4),
  events: list({ date: str, note: str }, 12),
  changes: strings(4),
  improvements: strings(3),
  worsenings: strings(3),
  hypotheses: list(
    {
      id: nullableStr,
      text: str,
      status: { type: "string", enum: ["proposed", "supported", "weakened"] },
    },
    6,
  ),
  conclusion: str,
  openQuestions: strings(3),
  questions: list(
    {
      text: str,
      kind: { type: "string", enum: ["yes_no", "choice"] },
      options: {
        ...strings(6),
        description: "для choice — 3–6 коротких вариантов; для yes_no — пусто",
      },
    },
    2,
  ),
  challenge: {
    anyOf: [
      object({
        title: str,
        description: str,
        durationDays: { type: "integer", minimum: 1, maximum: 7 },
        focus: {
          type: "string",
          enum: ["morning", "day", "evening", "night", "all"],
          description: "morning 5–12, day 12–17, evening 17–23, night 23–5",
        },
        expectation: str,
      }),
      { type: "null" },
    ],
  },
});

export const PHRASE_SCHEMA = object({ texts: strings(12) });
