import type { LanguageCode } from "../languages";
import * as common from "./common";
import * as catalog from "./catalog";
import * as replacements from "./replacements";
import * as achievements from "./achievements";
import * as report from "./report";
import * as home from "./home";
import * as stats from "./stats";
import * as journal from "./journal";
import * as settings from "./settings";
import * as onboarding from "./onboarding";
import * as paywall from "./paywall";
import * as privacy from "./privacy";
import * as coach from "./coach";
import * as widgets from "./widgets";
import * as ai from "./ai";
import * as language from "./language";

/** Every area of the app has its own folder of messages, one file per language. */
const NAMESPACES = {
  common,
  catalog,
  replacements,
  achievements,
  report,
  home,
  stats,
  journal,
  settings,
  onboarding,
  paywall,
  privacy,
  coach,
  widgets,
  ai,
  language,
};

export type Messages = { [K in keyof typeof NAMESPACES]: (typeof NAMESPACES)[K]["ru"] };

function build(language: LanguageCode): Messages {
  const result = {} as Record<string, unknown>;
  for (const [name, catalog] of Object.entries(NAMESPACES)) {
    result[name] = (catalog as Record<LanguageCode, unknown>)[language];
  }
  return result as Messages;
}

export const CATALOG: Record<LanguageCode, Messages> = {
  ru: build("ru"),
  en: build("en"),
  tr: build("tr"),
  de: build("de"),
  fr: build("fr"),
};
