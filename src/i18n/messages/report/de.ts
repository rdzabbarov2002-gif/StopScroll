import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("de", count, value);

const DAYS: PluralForms = { one: "Tag", other: "Tage" };
/** After "von": "3 von 5 Tagen". */
const DAYS_DATIVE: PluralForms = { one: "Tag", other: "Tagen" };
const WINS: PluralForms = { one: "Erfolg", other: "Erfolge" };
const SLIPS: PluralForms = { one: "Ausrutscher", other: "Ausrutscher" };
const URGES: PluralForms = { one: "Impuls", other: "Impulse" };
const ALTERNATIVES: PluralForms = { one: "Alternative", other: "Alternativen" };

export const de: Messages = {
  title: "Woche",
  back: "Zurück",
  olderWeek: "Vorherige Woche",
  newerWeek: "Nächste Woche",

  firstReport: {
    title: "Der erste Bericht kommt am Sonntag",
    text: "Jeden Sonntagabend wertet Ihr persönlicher Coach die Woche aus: was gelungen ist, wo der Feed gewinnt und was Sie als Nächstes ausprobieren können. Erfassen Sie Zeit und Ausrutscher — dann hat die Auswertung eine Grundlage.",
  },
  quietWeek: {
    title: "Eine ruhige Woche",
    text: "Für diese Tage gibt es keine Einträge: keine Erfolge über einen Impuls, keine Ausrutscher, keine erfasste Zeit.",
  },

  daySaved: (day: string, duration: string) => `${day}: ${duration} gewonnen`,
  dayScroll: (day: string, duration: string | null) =>
    `${day}: ${duration === null ? "nicht erfasst" : duration}`,

  saved: {
    label: "Gewonnen",
    change: (amount: string, more: boolean) =>
      `${amount} ${more ? "mehr" : "weniger"} als in der Vorwoche.`,
    total: (amount: string) =>
      `Die Pausen und Alternativen dieser Woche haben Ihnen ${amount} Lebenszeit geschenkt.`,
    none: "Diese Woche wurde noch keine Zeit gewonnen — die nächste SOS-Pause ändert das.",
    week: "Ganze Woche",
    wins: "Erfolge",
  },

  metrics: {
    inLimit: "Im Limit",
    ofDays: (logged: number) => `von ${logged} ${word(logged, DAYS_DATIVE)}`,
    slips: "Ausrutscher",
    replacements: "Alternativen",
    streak: "Serie",
    record: (days: number) => `Rekord: ${days} ${word(days, DAYS)}`,
    vsLastWeek: (delta: string) => `${delta} zur Vorwoche`,
  },

  impulses: {
    label: "Impulse",
    none: "Keine Impulse in dieser Woche.",
    success: (percent: number) => `${percent}\u00A0% der Impulse vergingen ohne Feed.`,
    breakdown: (total: number, wins: number, slips: number) =>
      `${total} ${word(total, URGES)}: ${wins} ${word(wins, WINS)}, ${slips} ${word(slips, SLIPS)}.`,
    byTime: "Nach Tageszeit",
    resisted: "Widerstanden",
    slips: "Ausrutscher",
    slot: (from: number, to: number, resisted: number, lost: number) =>
      `${from} bis ${to} Uhr: ${resisted}-mal widerstanden, ${lost} ${word(lost, SLIPS)}`,
  },

  hardest: {
    header: "Am schwierigsten",
    noData: "Keine Daten",
    day: "Kritischster Tag",
    hour: "Kritischste Zeit",
    trigger: "Häufigster Auslöser",
    slips: (count: number) => `${count} ${word(count, SLIPS)}`,
    mostFeed: (duration: string) => `Meiste Feed-Zeit: ${duration}`,
    mostPull: (count: number) => `Stärkster Sog zum Feed · ${count}-mal`,
    triggerSlips: (count: number, total: number) =>
      `${count} von ${total} ${total === 1 ? "Ausrutscher" : "Ausrutschern"}`,
    noSlips: "Keine Ausrutscher",
  },

  feed: {
    label: "Feed pro Tag",
    none: "Diese Woche wurde keine Feed-Zeit erfasst.",
    average: (average: string, inLimit: number, logged: number) =>
      `Im Schnitt ${average} pro Tag · ${inLimit} von ${logged} ${word(logged, DAYS_DATIVE)} im Limit.`,
    limit: (duration: string) => `Limit ${duration}`,
  },

  changes: {
    header: "Im Vergleich zur Vorwoche",
    saved: "Gewonnen",
    slips: "Ausrutscher",
    success: "Widerstanden",
    scroll: "Feed pro Tag",
    same: "Unverändert",
  },

  percent: (value: number, sign = "") => `${sign}${value}\u00A0%`,

  units: {
    days: DAYS,
    wins: WINS,
    slips: SLIPS,
    replacements: ALTERNATIVES,
  },

  reminder: {
    channel: "Wochenbericht",
    title: "Ihr Wochenbericht ist da",
    body: "Wie viel Zeit Sie zurückgewonnen haben, die schwierigsten Stunden und neue Auszeichnungen.",
  },
};
