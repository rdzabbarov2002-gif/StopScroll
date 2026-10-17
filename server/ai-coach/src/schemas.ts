/**
 * JSON Schemas for OpenAI Structured Outputs (strict mode): every property is required,
 * optional values are nullable, no additional properties. List lengths are capped with
 * maxItems — every output token is paid for. The app validates the same shapes again on its
 * side (and applies the deep analysis under its own evidence rules), so a malformed answer
 * never reaches the screen or the memory.
 */

const str = { type: "string" } as const;
const nullableStr = { type: ["string", "null"] } as const;
const strings = (maxItems: number) => ({ type: "array", items: str, maxItems }) as const;
const nullableHour = { type: ["integer", "null"], minimum: 0, maximum: 23 } as const;
/** How sure a reading is: 95 stated outright, 70 follows from the context, 40 a guess. */
const conf = { type: "integer", enum: [40, 70, 95] } as const;

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

/** null — "keep what is stored"; a list — the new section. */
const orNull = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });
const oneOf = (values: readonly string[]) => ({ type: "string", enum: values });
const nullableOneOf = (values: readonly string[]) => orNull(oneOf(values));

const titled = (maxItems: number) => list({ title: str, note: str }, maxItems);
const votes = (maxItems: number) =>
  list({ id: str, effect: oneOf(["support", "against"]) }, maxItems);

/** Entries in one /entry request: a batch of new ones, or the independent check before /deep. */
export const MAX_ENTRIES = 6;

export const ENTRY_SCHEMA = object({
  results: list(
    {
      n: { type: "integer" },
      enough: { type: "boolean" },
      cause: { ...nullableStr, description: "2–6 words" },
      emotion: { ...nullableStr, description: "1–4 words" },
      context: { ...nullableStr, description: "where, when, after what" },
      behavior: nullableStr,
      insight: nullableStr,
      missing: nullableStr,
      tags: strings(3),
      gist: str,
      conf,
      votes: votes(6),
    },
    MAX_ENTRIES,
  ),
});

const KINDS = ["hypothesis", "trigger", "zone", "tip"] as const;
const PARTS = ["morning", "day", "evening", "night", "any"] as const;

export const DEEP_SCHEMA = object({
  rereads: list(
    {
      ref: str,
      verdict: oneOf(["keep", "revise"]),
      cause: nullableStr,
      tags: strings(3),
      gist: nullableStr,
      conf,
      votes: votes(4),
      why: str,
    },
    8,
  ),
  beliefs: list(
    {
      op: oneOf(["add", "update", "confirm", "weaken", "retire", "supersede", "scope"]),
      id: { ...nullableStr, description: "the belief's id; null for add" },
      kind: nullableOneOf(KINDS),
      text: nullableStr,
      note: nullableStr,
      weekday: { type: ["integer", "null"], minimum: 0, maximum: 6 },
      from: nullableHour,
      to: nullableHour,
      when: nullableOneOf(PARTS),
      until: { ...nullableStr, description: "scope: YYYY-MM" },
      cites: strings(4),
      why: nullableStr,
    },
    12,
  ),
  profile: str,
  conclusion: str,
  emotions: orNull(titled(4)),
  strengths: orNull(strings(3)),
  weaknesses: orNull(strings(3)),
  changes: orNull(strings(4)),
  improvements: orNull(strings(3)),
  worsenings: orNull(strings(3)),
  events: list({ date: str, note: str }, 3),
  corrections: list({ was: str, now: str, why: str, refs: strings(4) }, 2),
  chapter: orNull(object({ month: str, note: str })),
  openQuestions: strings(3),
  questions: list(
    {
      text: str,
      kind: oneOf(["yes_no", "choice"]),
      options: {
        ...strings(6),
        description: "choice: 3–6 short options; yes_no: empty",
      },
      about: { ...nullableStr, description: "yes_no about one belief: its id" },
    },
    2,
  ),
  challenge: orNull(
    object({
      title: str,
      description: str,
      durationDays: { type: "integer", minimum: 1, maximum: 7 },
      focus: {
        ...oneOf(["morning", "day", "evening", "night", "all"]),
        description: "morning 5–12, day 12–17, evening 17–23, night 23–5",
      },
      expectation: str,
      tip: { ...nullableStr, description: "the id of the tip it tests" },
    }),
  ),
});

export const PHRASE_SCHEMA = object({ texts: strings(12) });

/** Texts in one /translate request (the app sends the memory in chunks). */
export const MAX_TRANSLATE = 80;

export const TRANSLATE_SCHEMA = object({ texts: strings(MAX_TRANSLATE) });
