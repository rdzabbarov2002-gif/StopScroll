import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, forms: PluralForms) => selectPlural("de", count, forms);
const DAYS: PluralForms = { one: "Tag", other: "Tage" };
const WINS: PluralForms = { one: "Sieg", other: "Siege" };

export const de: Messages = {
  empty: "Öffnen Sie StopScroll, damit hier Ihre Zahlen erscheinen.",
  today: {
    a11y: (saved: string) => `Heute gewonnen: ${saved}`,
    label: "Gewonnen",
    caption: "Heute",
    wins: (count: number) => `${count} ${word(count, WINS)} über den Feed`,
    noWins: "Eine Pause schenkt Zeit",
  },
  streak: {
    a11y: (days: number) => `Serie: ${days} ${word(days, DAYS)}`,
    label: "Serie",
    unit: (days: number) => word(days, DAYS),
    active: "innerhalb des Limits",
    start: "Heute eine Serie starten",
  },
  limit: {
    a11yUnlogged: "Limit: keine Zeit eingetragen",
    a11yLeft: (left: string) => `Limit: noch ${left} übrig`,
    label: "Limit",
    today: "Heute",
    left: "Noch übrig",
    over: "Über dem Limit",
    logPrompt: "Zeit für heute eintragen",
    ofToday: (limit: string) => `von ${limit} für heute`,
  },
  ring: {
    a11y: (used: string | null, limit: string) =>
      `Feed heute: ${used ?? "nicht eingetragen"} von ${limit}`,
    of: (limit: string) => `von ${limit}`,
    logPrompt: "Zeit eintragen",
    over: "Limit überschritten",
    feedToday: "Feed heute",
  },
  replacement: {
    a11y: (title: string) => `Statt Feed: ${title}`,
    label: "Statt Feed",
    caption: (duration: string) => `${duration} · alle 30 Min. neu`,
  },
};
