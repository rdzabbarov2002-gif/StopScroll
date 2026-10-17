import type { Messages } from "./ru";

const seconds = (count: number) => `${count} ${count === 1 ? "Sekunde" : "Sekunden"}`;

export const de: Messages = {
  units: {
    replacements: { one: "Alternative", other: "Alternativen" },
    seconds: { one: "Sekunde", other: "Sekunden" },
  },

  a11y: {
    locked: ", in Pro verfügbar",
    doneToday: ", heute erledigt",
  },

  close: "Schließen",

  list: {
    title: "Alternativen",
    add: "Eigene Alternative hinzufügen",
    filterAll: "Alle",
    filterMine: "Eigene",
    pickLabel: "Passt gerade",
    pickForTrigger: (phrase: string, title: string) =>
      `Wenn es Sie ${phrase} in den Feed zieht, probieren Sie „${title}“.`,
    pick: (title: string) => `Probieren Sie „${title}“ statt des Feeds.`,
    triggerPhrase: {
      boredom: "aus Langeweile",
      fatigue: "aus Müdigkeit",
      stress: "vor lauter Stress",
      loneliness: "aus Einsamkeit",
      procrastination: "statt an die Arbeit",
      autopilot: "auf Autopilot",
      relax: "zum Abschalten",
      sleepless: "in schlaflosen Nächten",
      other: "",
    },
    start: "Starten",
    emptyTitle: "Noch leer",
    emptyPro:
      "Fügen Sie eine Gewohnheit hinzu, die Ihnen Energie gibt: Gitarre, Liegestütze, eine Seite im Buch.",
    emptyFree: "Eigene Alternativen und Gewohnheiten gibt es mit Pro.",
    openPro: "Pro freischalten",
    catalog: "Katalog",
    today: (count: string) => `Heute ${count}`,
  },

  card: {
    own: "Eigene",
  },

  detail: {
    notFoundTitle: "Alternative nicht gefunden",
    notFoundText: "Vielleicht haben Sie sie gelöscht.",
    lockedTitle: "Diese Alternative gibt es in StopScroll Pro",
    lockedText: "Schalten Sie den ganzen Katalog frei: mehr Bewegung, Aufgaben und Fakten.",
    fact: (index: number, total: number) => `Fakt ${index} von ${total}`,
    nextFact: "Nächster Fakt",
    countWin: (minutes: string) => `Als Erfolg zählen · +${minutes}`,
    cancel: "Abbrechen",
    delete: "Löschen",
    deleteOwn: "Eigene Alternative löschen",
    timer: "Timer",
    timerDone: "Zeit um — sehr gut!",
    secondsLeft: (count: number) => `Noch ${seconds(count)}`,
    again: "Noch einmal",
    startTimer: (duration: string) => `Für ${duration} starten`,
  },

  custom: {
    title: "Eigene Alternative",
    subtitle: "Was für Sie funktioniert: Gitarre, Liegestütze, eine Seite im Buch.",
    name: "Name",
    namePlaceholder: "Zum Beispiel: 10 Liegestütze",
    nameA11y: "Name der Alternative",
    how: "So geht’s",
    howPlaceholder: "Optional: ein paar Stichworte",
    howA11y: "Beschreibung der Alternative, optional",
    type: "Art",
    duration: "Dauer",
    save: "Alternative speichern",
  },

  intercept: {
    passed: "Pause geschafft",
    title: "Ist der Impuls schwächer?",
    text: "Sie haben Ihrem präfrontalen Kortex Zeit gegeben, sich einzuschalten. Jetzt entscheiden Sie, nicht der Algorithmus.",
    whatTriggered: "Was hat den Impuls ausgelöst?",
    suggestionsFor: {
      boredom: "Alternativen bei Langeweile",
      fatigue: "Alternativen bei Müdigkeit",
      stress: "Alternativen bei Stress",
      loneliness: "Alternativen bei Einsamkeit",
      procrastination: "Alternativen beim Aufschieben",
      autopilot: "Alternativen gegen den Autopiloten",
      relax: "Alternativen zum Abschalten",
      sleepless: "Alternativen bei Schlaflosigkeit",
      other: "Alternativen für andere Fälle",
    },
    suggestionsAny: "Tauschen Sie den Feed gegen 1–3 Minuten",
    switched: (minutes: string) => `Ich habe umgeschaltet · +${minutes}`,
    more: "Noch 15 Sekunden",
    logSlip: "Der Feed hat gewonnen — Ausrutscher eintragen",
    pause: "Pause",
    closePause: "Pause schließen",
    heading: "15 Sekunden Stille",
    wave: "Ein Impuls ist wie eine Welle. Lassen Sie ihn vorüberziehen — das Handy kann warten.",
    phaseA11y: (phase: string, count: number) => `${phase}. Noch ${seconds(count)}`,
    step: (index: number, total: number) => `Schritt ${index} von ${total}`,
  },

  win: {
    overline: "Impuls besiegt",
    saved:
      "dem Feed abgerungen. Ihr Gehirn bekam ehrliches Dopamin — durch eine Entscheidung, nicht durchs Scrollen.",
    today: "Heute",
    total: "Insgesamt gespart",
    already: "Das sind schon",
    back: "Zurück",
    undo: "Eintrag rückgängig machen",
  },
};
