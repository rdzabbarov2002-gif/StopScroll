import { m } from "../i18n";

/**
 * Guards for the optional rephrasing of the coach's sentences. A rephrased sentence is used only
 * if it keeps every fact of the original: the same numbers, times and weekdays, nothing new, no
 * exclamations or emoji, no mention of the technology. Otherwise the original wording stays.
 * The words to look for (weekdays, the technology) come from the current language's messages.
 */

// Plain character classes instead of \p{…} and look-behind: they behave the same on every engine.
// Latin with its accented letters, and Cyrillic.
const LETTER = "A-Za-z\u00C0-\u024F\u0400-\u04FF";
const NOT_LETTER = `(^|[^${LETTER}])`;
const END = `(?![${LETTER}])`;
/** The technology's names, the same in every language. */
const FORBIDDEN = new RegExp(
  `${NOT_LETTER}(AI|GPT|ChatGPT|LLM|Claude|Anthropic|OpenAI)${END}`,
  "i",
);
const NUMBER = /\d+(?:[.,]\d+)?/g;
// Emoji and pictographs: the symbol blocks and every astral-plane pictograph.
const EMOJI = /[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]/;

const numbers = (text: string) =>
  (text.match(NUMBER) ?? []).map((value) => value.replace(",", ".")).sort();
const exclamations = (text: string) => (text.match(/!/g) ?? []).length;

export function isFaithfulPhrasing(original: string, candidate: unknown): candidate is string {
  if (typeof candidate !== "string") return false;
  const text = candidate.replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (text.length < original.length * 0.5 || text.length > original.length * 1.6 + 30) return false;
  const guard = m().coach.guard;
  if (FORBIDDEN.test(text) || guard.forbidden.test(text) || EMOJI.test(text)) return false;
  if (exclamations(text) > exclamations(original)) return false;
  const before = numbers(original);
  const after = numbers(text);
  if (before.length !== after.length || before.some((value, index) => value !== after[index])) {
    return false;
  }
  return guard.weekdays.every((day) => day.test(original) === day.test(text));
}
