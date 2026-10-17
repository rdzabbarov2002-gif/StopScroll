import { getLanguage, useLanguage } from "./store";
import { CATALOG, type Messages } from "./messages";
import { selectPlural, type PluralForms } from "./plural";

export {
  LANGUAGES,
  LANGUAGE_CODES,
  deviceLanguage,
  getLanguageInfo,
  isLanguage,
} from "./languages";
export type { LanguageCode } from "./languages";
export { getLanguage, setLanguage, useLanguage } from "./store";
export type { Messages } from "./messages";
export type { PluralForms } from "./plural";

/** Messages of the current language — for code outside React (formatting, coach, analytics). */
export const m = (): Messages => CATALOG[getLanguage()];

/** Messages of the current language in a component; re-renders when the language changes. */
export function useT(): Messages {
  return CATALOG[useLanguage()];
}

/** The word for a count in the current language: plural(3, DAYS) → "дня" / "days". */
export const plural = (count: number, forms: PluralForms) =>
  selectPlural(getLanguage(), count, forms);

/** The number with its word: countOf(3, DAYS) → "3 дня" / "3 days". */
export const countOf = (count: number, forms: PluralForms, separator = " ") =>
  `${count}${separator}${selectPlural(getLanguage(), count, forms)}`;
