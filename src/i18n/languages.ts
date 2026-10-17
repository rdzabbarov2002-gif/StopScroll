/**
 * The languages the app speaks. To add one: append it here, add its messages in every folder
 * of `messages/` (TypeScript reports anything missing) and its plural rule in `plural.ts`.
 */
export const LANGUAGES = [
  { code: "ru", nativeName: "Русский", englishName: "Russian", locale: "ru-RU" },
  { code: "en", nativeName: "English", englishName: "English", locale: "en-US" },
  { code: "tr", nativeName: "Türkçe", englishName: "Turkish", locale: "tr-TR" },
  { code: "de", nativeName: "Deutsch", englishName: "German", locale: "de-DE" },
  { code: "fr", nativeName: "Français", englishName: "French", locale: "fr-FR" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES: readonly LanguageCode[] = LANGUAGES.map((item) => item.code);

export const isLanguage = (value: unknown): value is LanguageCode =>
  typeof value === "string" && (LANGUAGE_CODES as readonly string[]).includes(value);

export const getLanguageInfo = (code: LanguageCode) =>
  LANGUAGES.find((item) => item.code === code)!;

/** The device's language, if it is one of ours — only to highlight it on the picker. */
export function deviceLanguage(): LanguageCode | null {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    const code = locale.slice(0, 2).toLowerCase();
    return isLanguage(code) ? code : null;
  } catch {
    return null;
  }
}
