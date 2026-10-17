import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("de", count, value);

const ACHIEVEMENTS: PluralForms = { one: "Auszeichnung", other: "Auszeichnungen" };

export const de: Messages = {
  title: "Auszeichnungen",
  back: "Zurück",
  earned: "Erhalten",
  ofTotal: (total: number) => `von ${total}`,
  closest: (title: string, progress: string) => `Am nächsten dran: „${title}“ — ${progress}.`,
  allEarned: "Sie haben alle Auszeichnungen gesammelt. Der Feed hat nichts mehr zu sagen.",
  earnedCount: (count: number) => `${count} ${word(count, ACHIEVEMENTS)}`,
  ahead: "Noch offen",
  earnedOn: (date: string) => `Erhalten am ${date}`,
  howToEarn: "So erhalten Sie sie",

  progress: {
    minutes: (current: string, target: string) => `${current} von ${target}`,
    // The unit follows "von", so it takes the dative: "3 von 7 Tagen".
    count: (current: number, target: number, unit: PluralForms) =>
      `${current} von ${target} ${word(target, unit)}`,
    once: "Noch offen",
    onceInline: "noch offen",
  },

  // Dative forms, as they follow "von".
  units: {
    times: { one: "Mal", other: "Mal" },
    days: { one: "Tag", other: "Tagen" },
    nights: { one: "Nacht", other: "Nächten" },
    replacements: { one: "Alternative", other: "Alternativen" },
    refusals: { one: "Mal", other: "Mal" },
  },

  unlock: {
    overline: "Neue Auszeichnung",
    close: "Super",
    openAll: "Alle Auszeichnungen",
  },

  items: {
    "first-choice": {
      title: "Die erste Wahl für sich",
      description:
        "Der Impuls zog Sie in den Feed, doch Sie haben die Pause gewählt. Damit beginnt alles.",
      hint: "Machen Sie eine Pause oder wählen Sie eine Alternative statt des Feeds.",
    },
    "first-evening": {
      title: "Erster Abend ohne Feed",
      description:
        "Ein Abend, an dem Sie standhaft blieben und kein einziges Mal im Feed landeten.",
      hint: "Widerstehen Sie abends (17–23 Uhr) dem Feed und beenden Sie den Abend ohne Ausrutscher.",
    },
    "first-hour": {
      title: "Die erste gewonnene Stunde",
      description: "60 Minuten, die Ihnen geblieben sind — nicht dem Algorithmus.",
      hint: "Gewinnen Sie 60 Minuten durch Pausen und Alternativen.",
    },
    "morning-free": {
      title: "Der Morgen gehört Ihnen",
      description: "Ein Morgen, der mit einer Pause begann statt mit endlosem Scrollen.",
      hint: "Widerstehen Sie morgens (5–12 Uhr) dem Feed und bleiben Sie bis mittags ohne Ausrutscher.",
    },
    comeback: {
      title: "Ausgerutscht — und zurück",
      description:
        "Ein Ausrutscher war kein Grund aufzugeben: Den nächsten Impuls haben Sie gemeistert.",
      hint: "Widerstehen Sie innerhalb von 24 Stunden nach einem erfassten Ausrutscher einem Impuls.",
    },
    "honest-look": {
      title: "Fünf ehrliche Rückblicke",
      description:
        "Fünfmal nach einem Ausrutscher ein ruhiges Gespräch über das Geschehene statt Selbstkritik.",
      hint: "Beantworten Sie nach fünf Ausrutschern die Frage des Coachs „Was ist passiert?“.",
    },
    "sunday-evening": {
      title: "Der Sonntagabend gehört Ihnen",
      description:
        "Der Abend mit dem meisten Feed der Woche verging ohne einen einzigen Ausrutscher.",
      hint: "Widerstehen Sie am Sonntagabend dem Feed und beenden Sie ihn ohne Ausrutscher.",
    },
    "week-in-limit": {
      title: "Eine Woche im eigenen Takt",
      description: "Sieben Tage in Folge im Limit. Der Feed gibt nicht mehr den Takt vor.",
      hint: "Bleiben Sie 7 Tage in Folge innerhalb Ihres Tageslimits.",
    },
    "nights-7": {
      title: "7 Abende ohne nächtliches Scrollen",
      description: "Sieben Nächte, in denen der Schlaf wichtiger war als der Feed.",
      hint: "Bleiben Sie an Tagen, an denen Sie StopScroll nutzen, 7 Nächte (22–5 Uhr) ohne Ausrutscher.",
    },
    "stress-10": {
      title: "Stress ohne Flucht",
      description: "10-mal sind Sie Stress ohne Feed begegnet. Genau das ist Widerstandskraft.",
      hint: "Widerstehen Sie 10-mal, wenn Stress Sie in den Feed zieht.",
    },
    "boredom-20": {
      title: "20 Siege über die Langeweile",
      description: "Zwanzigmal lockte die Langeweile in den Feed — und verlor zwanzigmal.",
      hint: "Widerstehen Sie 20-mal, wenn Langeweile Sie in den Feed zieht.",
    },
    "replacements-25": {
      title: "Körper und Kopf statt Feed",
      description:
        "25-mal haben Sie Bewegung, eine Aufgabe oder einen Fakt statt Scrollen gewählt.",
      hint: "Nutzen Sie 25 sinnvolle Alternativen.",
    },
    "refusals-30": {
      title: "30-mal Nein in Folge",
      description: "Dreißig Impulse in Folge — und kein einziger Ausrutscher dazwischen.",
      hint: "Widerstehen Sie 30-mal in Folge ohne Ausrutscher.",
    },
    "half-feed": {
      title: "Halb so viel Feed",
      description: "Eine Woche, in der der Feed nur halb so viel Zeit kostete wie vor StopScroll.",
      hint: "Erfassen Sie 7 Tage lang Ihre Zeit: im Schnitt höchstens die Hälfte des Ausgangswerts.",
    },
    "day-of-life": {
      title: "Ein ganzer Tag Leben — für Sie",
      description: "1.440 Minuten gewonnen. Ein ganzer Tag, den Sie sich zurückgeholt haben.",
      hint: "Gewinnen Sie 24 Stunden durch Pausen und Alternativen.",
    },
  },

  firstEveningWith: (app: string) => `Erster Abend ohne ${app}`,
};
