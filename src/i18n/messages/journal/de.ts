import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("de", count, value);

const ENTRIES: PluralForms = { one: "Eintrag", other: "Einträge" };

const WEEKDAY_PHRASES = [
  "montags",
  "dienstags",
  "mittwochs",
  "donnerstags",
  "freitags",
  "samstags",
  "sonntags",
] as const;

export const de: Messages = {
  title: "Tagebuch",
  intro:
    "Notieren Sie einen Ausrutscher in 10 Sekunden — ohne Selbstkritik. Der Coach fragt, was passiert ist, und zeigt mit der Zeit, was sich wiederholt.",
  deepAnalytics: "Tiefenanalyse",
  locked: {
    title: "Die Stunden und Tage, an denen der Feed gewinnt",
    text: "Diagramme der Ausrutscher nach Uhrzeit und Wochentag, dazu eine Auswertung: wo Sie standhalten und wo nicht.",
  },
  empty: {
    title: "Noch keine Einträge",
    text: "Und das ist gut so. Falls der Feed doch gewinnt, notieren Sie es hier, um Muster zu erkennen.",
  },
  history: "Verlauf der Ausrutscher",
  entries: (count: number) => `${count} ${word(count, ENTRIES)}`,
  showMore: "Mehr anzeigen",
  form: {
    label: "Ausrutscher notieren",
    statement: "Der Feed hat gewonnen? Das kommt vor.",
    where: "Wo",
    howLong: "Wie lange",
    save: "Ausrutscher notieren",
  },
  patterns: {
    label: "Muster",
    addMore: (count: number) =>
      `Noch ${count} ${word(count, ENTRIES)}, dann zeigen wir, wann und warum der Feed am häufigsten gewinnt.`,
    slipsWeek: "Ausrutscher in 7 Tagen",
    lostWeek: "Verloren in 7 Tagen",
    resisted: "Widerstanden",
    percent: (percent: number) => `${percent}\u00A0%`,
    riskyTime: "Kritische Zeit",
    topApp: "Haupt-Feed",
    summary: (time: string, reason: string) =>
      `Ausrutscher passieren am häufigsten ${time} ${reason}.`,
    detail: (hours: string, weekday: number) =>
      `Kritische Stunde: ${hours}. Am schwersten ist es ${WEEKDAY_PHRASES[weekday]}.`,
    weekdayPhrases: WEEKDAY_PHRASES,
  },
  deep: {
    byHour: "Ausrutscher nach Uhrzeit",
    byWeekday: "Ausrutscher nach Wochentag",
    noData: "Noch keine Daten",
    columnA11y: (label: string, count: number) => `${label}: ${count} Ausrutscher`,
    readout: (label: string, count: number) => `${label} · ${count} Ausrutscher`,
    triggers: "Auslöser: standgehalten oder nachgegeben",
    resisted: "Standgehalten",
    slips: "Ausrutscher",
    triggersEmpty:
      "Notieren Sie den Grund in der SOS-Pause und im Tagebuch — dann erscheint hier die Aufschlüsselung.",
    triggerA11y: (label: string, resisted: number, slips: number) =>
      `${label}: ${resisted}-mal standgehalten, ${slips} Ausrutscher`,
  },
  item: {
    noReason: "Kein Grund angegeben",
    delete: "Eintrag löschen",
    reflectA11y: "Ausrutscher mit dem Coach besprechen",
    reflect: "Besprechen",
    confirm: "Diesen Eintrag löschen?",
    cancel: "Abbrechen",
    confirmDelete: "Löschen",
  },
  demoNote: "Vor dem Schlafen „nur kurz“ reingeschaut",
};
