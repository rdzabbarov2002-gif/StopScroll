import type { LanguageCode } from "./languages";

/**
 * Plural forms of a word after a number. `few` and `many` are used by Russian only;
 * the other languages need `one` and `other` (Turkish keeps the noun singular, so its
 * `one` and `other` are usually the same word).
 */
export interface PluralForms {
  one: string;
  few?: string;
  many?: string;
  other: string;
}

export type PluralCategory = "one" | "few" | "many" | "other";

const RULES: Record<LanguageCode, (count: number) => PluralCategory> = {
  ru: (count) => {
    if (!Number.isInteger(count)) return "other";
    const n = Math.abs(count) % 100;
    const last = n % 10;
    if (last === 1 && n !== 11) return "one";
    if (last >= 2 && last <= 4 && (n < 12 || n > 14)) return "few";
    return "many";
  },
  en: (count) => (Math.abs(count) === 1 ? "one" : "other"),
  de: (count) => (Math.abs(count) === 1 ? "one" : "other"),
  tr: (count) => (Math.abs(count) === 1 ? "one" : "other"),
  // French: 0 and 1 take the singular ("0 jour", "1,5 jour").
  fr: (count) => (Math.abs(count) < 2 ? "one" : "other"),
};

export function pluralCategory(language: LanguageCode, count: number): PluralCategory {
  return RULES[language](count);
}

export function selectPlural(language: LanguageCode, count: number, forms: PluralForms): string {
  const category = pluralCategory(language, count);
  if (category === "few") return forms.few ?? forms.other;
  if (category === "many") return forms.many ?? forms.other;
  return forms[category];
}
