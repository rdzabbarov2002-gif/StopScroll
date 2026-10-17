import type { Messages } from "./ru";

export const de: Messages = {
  step: (current: number, total: number) => `Schritt ${current} von ${total}`,
  intro: "Kognitives Anti-Scrolling: Wir fangen den Impuls ab, bevor der Feed Sie hineinzieht.",
  promises: {
    sos: {
      title: "15 Sekunden SOS-Pause",
      text: "Atmen und Erden, bis der Impuls nachlässt.",
    },
    replacements: {
      title: "Mini-Alternativen",
      text: "1–3 Minuten Bewegung, eine Aufgabe oder ein Fakt statt Feed.",
    },
    stats: {
      title: "Ehrliche Statistik",
      text: "Wie viel Zeit Sie zurückgewonnen haben – für Bücher, Schlaf und Spaziergänge.",
    },
  },
  start: "Los geht’s",
  demo: "Mit Beispieldaten ansehen",
  baseline: {
    overline: "Ehrlicher Ausgangspunkt",
    title: "Wie viel Zeit verbringen Sie derzeit täglich im Feed?",
    text: "Ungefähr – nach Gefühl oder laut „Bildschirmzeit“. Das ist Ihr Ausgangswert zum Vergleich.",
    slider: "Minuten pro Tag im Feed derzeit",
    mainApp: "Wo bleiben Sie am häufigsten hängen?",
    next: "Weiter",
  },
  goal: {
    overline: "Realistisches Ziel",
    title: "Wie viel Feed pro Tag ist für Sie in Ordnung?",
    text: "Sie müssen nicht alles auf einmal aufgeben. Jeder Tag im Limit verlängert Ihre Serie.",
    limit: "Tageslimit",
    session: "Eine „Sitzung“ im Feed",
    sessionHint: "So viele Minuten rechnen wir für jeden Erfolg über einen Impuls an",
    summary: (perDay: string, perWeek: string) =>
      `Ziel: ${perDay} weniger pro Tag. Das sind ${perWeek} pro Woche, die Sie zurückgewinnen.`,
    done: "Fertig",
    back: "Zurück",
  },
};
