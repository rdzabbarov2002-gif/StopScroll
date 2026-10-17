import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("de", count, value);

const DAYS: PluralForms = { one: "Tag", other: "Tage" };
const WEEKS: PluralForms = { one: "Woche", other: "Wochen" };
const WINS: PluralForms = { one: "Erfolg", other: "Erfolge" };
const EQUIVALENTS: PluralForms = { one: "Gegenwert", other: "Gegenwerte" };

export const de: Messages = {
  title: "Statistik",
  weeklyReport: "Wochenbericht",
  achievements: "Auszeichnungen",
  achievementsCount: (earned: number, total: number) => `${earned} von ${total}`,
  today: "Heute",
  yesterday: "Gestern",
  noEntry: "kein Eintrag",
  dayValue: (day: string, value: string) => `${day}: ${value}`,
  limitLine: (duration: string) => `Limit ${duration}`,
  trend: {
    label: "Feed-Zeit",
    days: (days: number) => `${days} ${word(days, DAYS)}`,
    average: "Im Schnitt",
    empty: "Noch keine Einträge",
    perDay: "pro Tag",
  },
  logger: {
    label: "Zeit eintragen",
    question: "Wie viel Zeit ging in den Feed?",
    hint: "Reels, TikTok, Shorts — alles zusammen",
    over: (duration: string) => `${duration} über dem Limit`,
    within: (limit: string) => `Innerhalb des Limits von ${limit}`,
    minus: "Minus 5 Minuten",
    plus: "Plus 5 Minuten",
    slider: "Minuten im Feed pro Tag",
    preset: (duration: string) => `${duration} einstellen`,
    saved: "Eingetragen",
    save: "Eintragen",
    update: "Eintrag aktualisieren",
    footnote:
      "Die genaue Zeit zeigt Ihnen „Bildschirmzeit“ auf iOS oder „Digital Wellbeing“ auf Android.",
  },
  comparison: {
    label: "Vergleich",
    before: "Vor StopScroll",
    both: (yesterday: string, today: string) => `Gestern ${yesterday}, heute ${today}`,
    todayOnly: (today: string) => `Heute ${today}`,
    empty: "Tragen Sie die Zeit für heute ein",
    noData: "keine Daten",
    change: (sign: string, percent: number) => `${sign}${percent}\u00A0%`,
    vsYesterday: (change: string) => `${change} zu gestern`,
    vsBaseline: (change: string) => `${change} zum Start`,
    sameAsYesterday: "wie gestern",
    sameAsBaseline: "wie zu Beginn",
  },
  heatmap: {
    label: "Tage im Griff",
    rule: (limit: string) => `Ein Tag zählt, wenn Sie höchstens ${limit} im Feed waren.`,
    streak: "Serie",
    record: "Rekord",
    month: "In 30 Tagen",
    days: DAYS,
    status: {
      great: "unter dem halben Limit",
      ok: "im Limit",
      over: "über dem Limit",
      empty: "kein Eintrag",
      future: "",
    },
    cellValue: (duration: string, status: string) => `${duration}, ${status}`,
    selectedValue: (duration: string, status: string) => `${duration} — ${status}`,
    hint: "Tippen Sie auf einen Tag, um Details zu sehen.",
    legend: {
      great: "≤ ½ Limit",
      ok: "im Limit",
      over: "über dem Limit",
      empty: "kein Eintrag",
    },
    more: (weeks: number) => `${weeks} ${word(weeks, WEEKS)} Verlauf anzeigen — mit Pro`,
  },
  equivalents: {
    label: "Gewonnene Zeit",
    total: (duration: string) => `Insgesamt haben Sie sich ${duration} zurückgeholt.`,
    empty: "Jede Pause und jede Alternative schenkt Ihnen Zeit — sie erscheint dann hier.",
    summary: (wins: number, week: string, session: string) =>
      `${wins} ${word(wins, WINS)} · ${week} in 7 Tagen. Jeder Erfolg = ${session}, die sonst meist im Feed gelandet wären.`,
    lockedTitle: (count: number) => `${count} weitere ${word(count, EQUIVALENTS)} in Pro`,
    lockedText: "Workouts, Sprachstunden und Gespräche mit Ihren Liebsten.",
  },
};
