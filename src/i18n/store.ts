import { useSyncExternalStore } from "react";

import type { LanguageCode } from "./languages";

/**
 * The language in use. Plain module state, so code outside React (formatting, the on-device
 * coach, analytics, widget tasks) reads it synchronously; React screens subscribe through
 * `useLanguage()`. Russian until the saved choice is loaded — the app shows the language
 * picker before anything else when no choice has been made.
 */
let current: LanguageCode = "ru";
const listeners = new Set<() => void>();

export const getLanguage = (): LanguageCode => current;

export function setLanguage(language: LanguageCode) {
  if (language === current) return;
  current = language;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useLanguage = (): LanguageCode =>
  useSyncExternalStore(subscribe, getLanguage, getLanguage);
