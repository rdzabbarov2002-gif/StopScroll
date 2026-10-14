/**
 * Guards for the optional rephrasing of the coach's sentences. A rephrased sentence is used only
 * if it keeps every fact of the original: the same numbers, times and weekdays, nothing new, no
 * exclamations or emoji, no mention of the technology. Otherwise the original wording stays.
 */

// Plain character classes instead of \p{…} and look-behind: they behave the same on every engine.
const NOT_LETTER = "(^|[^A-Za-zА-Яа-яЁё])";
const END = "(?![A-Za-zА-Яа-яЁё])";
const FORBIDDEN = new RegExp(
  `${NOT_LETTER}(AI|ИИ|GPT|ChatGPT|LLM|Claude|Anthropic)${END}|искусствен|нейросет|языков[а-яё]* модел`,
  "i",
);
const NUMBER = /\d+(?:[.,]\d+)?/g;
// Emoji and pictographs: the symbol blocks and every astral-plane pictograph.
const EMOJI = /[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]/;
const WEEKDAYS = [
  /понедельник/i,
  /вторник/i,
  new RegExp(`${NOT_LETTER}сред(?:а|у|ы|е|ам|ой|ами|ах)${END}`, "i"),
  /четверг/i,
  /пятниц/i,
  /суббот/i,
  /воскресен/i,
];

const numbers = (text: string) =>
  (text.match(NUMBER) ?? []).map((value) => value.replace(",", ".")).sort();
const exclamations = (text: string) => (text.match(/!/g) ?? []).length;

export function isFaithfulPhrasing(original: string, candidate: unknown): candidate is string {
  if (typeof candidate !== "string") return false;
  const text = candidate.replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (text.length < original.length * 0.5 || text.length > original.length * 1.6 + 30) return false;
  if (FORBIDDEN.test(text) || EMOJI.test(text)) return false;
  if (exclamations(text) > exclamations(original)) return false;
  const before = numbers(original);
  const after = numbers(text);
  if (before.length !== after.length || before.some((value, index) => value !== after[index])) {
    return false;
  }
  return WEEKDAYS.every((day) => day.test(original) === day.test(text));
}
