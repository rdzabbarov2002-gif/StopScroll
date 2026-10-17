import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("de", count, value);

const DAYS: PluralForms = { one: "Tag", other: "Tage" };

export const de: Messages = {
  settings: "Einstellungen",
  today: "Heute",
  yesterday: "Gestern",
  noEntry: "kein Eintrag",
  dayValue: (day: string, value: string) => `${day}: ${value}`,
  feed: {
    a11y: "Feed-Zeit, Statistik öffnen",
    label: "Feed-Zeit",
    limitLine: (duration: string) => `Limit ${duration}`,
    empty: "Tragen Sie ein, wie viel Zeit heute in den Feed geflossen ist.",
    withinLimit: (duration: string) => `Heute ${duration} im Feed — innerhalb des Limits.`,
    overLimit: (duration: string) => `Heute ${duration} im Feed — das ist über dem Limit.`,
    less: (percent: number) => `Heute waren Sie ${percent}\u00A0% kürzer im Feed als gestern.`,
    more: (percent: number) => `Heute waren Sie ${percent}\u00A0% länger im Feed als gestern.`,
    same: "Heute waren Sie genauso lange im Feed wie gestern.",
  },
  limit: {
    a11y: "Limit und Serie, Statistik öffnen",
    label: "Limit",
    streak: "Serie",
    record: "Rekord",
    days: DAYS,
    streakDays: (days: number) =>
      `${days} ${word(days, DAYS)} in Folge halten Sie Ihr Limit schon ein.`,
    firstDay: "Der erste Tag im Limit. Morgen geht die Serie weiter.",
    over: "Heute ist das Limit überschritten. Morgen beginnt eine neue Serie.",
    start: (limit: string) =>
      `Bleiben Sie bei höchstens ${limit} am Tag — dann beginnt hier Ihre Serie.`,
    dayWithin: "im Limit",
    dayOver: "über dem Limit",
  },
  saved: {
    a11y: "Gewonnene Zeit, Statistik öffnen",
    label: "Gewonnene Zeit",
    today: (duration: string, wins: number) =>
      `Heute haben Sie sich ${duration} zurückgeholt — ${wins}-mal dem Impuls widerstanden.`,
    empty: "Jede Pause schenkt Ihnen Zeit. Zieht es Sie in den Feed, tippen Sie auf Pause.",
    total: "Gesamt",
  },
  pick: {
    a11y: (title: string) => `Alternative des Tages: ${title}`,
    label: "Alternative des Tages",
    start: "Starten",
  },
  tiles: {
    a11y: (label: string, title: string, caption: string) => `${label}: ${title}, ${caption}`,
    report: "Bericht",
    newReport: "Neuer Bericht",
    sunday: "Am Sonntag",
    reportSaved: (duration: string) => `${duration} gewonnen`,
    reportPromise: "Ihr Coach wertet Ihre Woche aus",
    achievements: "Auszeichnungen",
    achievementsCount: (earned: number, total: number) => `${earned} von ${total}`,
    firstAchievement: "Die erste gibt es nach der ersten Pause",
  },
};
