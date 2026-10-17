import type { Messages } from "./ru";

export const de: Messages = {
  back: "Heute",
  title: "Einstellungen",
  pro: {
    title: "StopScroll Pro",
    active: "StopScroll Pro ist aktiv",
    open: "StopScroll Pro öffnen",
    activeText: "Alle Übungen, Alternativen und tiefgehenden Analysen sind freigeschaltet.",
    pitch: "Alle Übungen, eigene Alternativen und tiefgehende Analysen",
    restore: "Käufe wiederherstellen",
    restored: "Pro wurde wiederhergestellt.",
    nothingToRestore: "Keine aktiven Käufe gefunden.",
  },
  appearance: "Darstellung",
  goals: {
    header: "Ziele",
    limit: "Tageslimit für den Feed",
    limitHint: "Ein Tag im Limit setzt Ihre Serie fort",
    session: "Eine Sitzung im Feed",
    sessionHint: "So viele Minuten rechnen wir pro Erfolg an",
    baseline: "Ausgangswert",
    baselineHint: "So viel Zeit ging vor StopScroll täglich drauf",
  },
  coach: {
    header: "Coach und Berichte",
    footer: (time: string) =>
      `Sonntags um ${time} wertet der Coach Ihre Woche aus und meldet sich, sobald der Bericht fertig ist.`,
    footerWithPhrasing: (time: string) =>
      `Sonntags um ${time} wertet der Coach Ihre Woche aus und schickt eine Mitteilung. Natürliche Formulierungen: ChatGPT formuliert die Erkenntnisse des Coachs um (ohne Notizen und Einträge) – Fakten und Zahlen bleiben gleich. Funktioniert, wenn die KI-Analyse erlaubt ist.`,
    report: "Bericht am Sonntag",
    reportSwitch: "Über den Wochenbericht benachrichtigen",
    phrasing: "Natürliche Formulierungen",
    phrasingSwitch: "Natürliche Formulierungen für Coach-Tipps",
    notificationsWeb: "Mitteilungen funktionieren in der App für iPhone und Android.",
    notificationsDenied:
      "Erlauben Sie Mitteilungen für StopScroll in den Handy-Einstellungen, um den Bericht zu erhalten.",
  },
  ai: {
    header: "KI-Coach",
    offFooter: "In dieser Version ist die KI-Analyse nicht aktiv: Einträge bleiben auf dem Handy.",
    offValue: "Nicht verbunden",
    footer:
      "Einträge, Antworten und Gewohnheitsstatistiken gehen nur mit Ihrer Erlaubnis über den StopScroll-Server an OpenAI (ChatGPT). Das Gedächtnis des Coachs bleibt auf dem Handy.",
    consent: "Analyse mit ChatGPT",
    consentSwitch: "Analyse der Einträge mit ChatGPT erlauben",
    confirmErase: "Einträge und Coach-Gedächtnis löschen?",
    erase: "Daten des KI-Coachs löschen",
  },
  feed: "Haupt-Feed",
  dev: {
    demo: "Demoversion",
    development: "Entwicklung",
    demoText:
      "Dies ist die Vorschau im Browser: Zahlungen sind deaktiviert. Füllen Sie die App mit Beispieldaten, um Diagramme, Serien und Muster zu sehen.",
    demoFill: "Mit Beispieldaten füllen",
    testPro: "Test-Pro",
    testProDemo: "Schaltet Pro-Funktionen ohne Kauf frei, damit Sie sie ansehen können.",
    testProDev: "Nur im Dev-Build: schaltet Pro-Funktionen ohne Kauf frei.",
  },
  data: {
    header: "Daten",
    text: "Alle Daten werden nur auf diesem Gerät gespeichert. Das Zurücksetzen löscht den Verlauf von Zeit, Erfolgen und Ausrutschern, eigene Alternativen, Impuls-Einträge und das Gedächtnis des KI-Coachs, behält aber Ziele und Abo.",
    reset: "Fortschritt zurücksetzen",
  },
  cancel: "Abbrechen",
  erase: "Löschen",
};
