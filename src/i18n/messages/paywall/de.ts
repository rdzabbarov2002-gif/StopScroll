import { selectPlural, type PluralForms } from "../../plural";
import type { Messages, PeriodUnit } from "./ru";

const PERIODS: Record<PeriodUnit, PluralForms> = {
  DAY: { one: "Tag", other: "Tage" },
  WEEK: { one: "Woche", other: "Wochen" },
  MONTH: { one: "Monat", other: "Monate" },
  YEAR: { one: "Jahr", other: "Jahre" },
};

export const de: Messages = {
  close: "Schließen",
  title: "StopScroll Pro",
  activeTitle: "Pro ist aktiv",
  thanks: "Danke, dass Sie die App unterstützen!",
  activeText: "Alle Übungen, Alternativen und Analysen sind freigeschaltet.",
  done: "Fertig",
  plansFailed: "Die Tarife konnten nicht geladen werden.",
  retry: "Erneut versuchen",
  tryTrial: (trial: string) => `${trial} testen`,
  subscribe: "Pro abonnieren",
  restore: "Käufe wiederherstellen",
  nothingToRestore: "Für dieses Store-Konto wurden keine aktiven Käufe gefunden.",
  renewal: (plan: string, price: string) =>
    `Das Abo „${plan}“ für ${price} verlängert sich automatisch, bis Sie es kündigen. Kündigen können Sie jederzeit in den Einstellungen von App Store oder Google Play – spätestens 24 Stunden vor Ende des Zeitraums.`,
  table: {
    free: "Gratis",
    pro: "Pro",
    yes: "ja",
    no: "nein",
    row: (label: string, free: string, pro: string) => `${label}: gratis – ${free}, Pro – ${pro}`,
  },
  rows: {
    sos: "SOS-Pause",
    exercises: "Pausenübungen",
    replacements: "Alternativen",
    replacementsPro: (count: number) => `${count} + eigene`,
    trend: "Verlauf",
    heatmap: "Heatmap",
    converter: "Zeitrechner",
    patterns: "Muster",
    days: (count: number) => `${count} Tage`,
    weeks: (count: number) => `${count} Wochen`,
  },
  headlines: {
    default: {
      title: "Holen Sie sich Ihre Zeit von den Algorithmen zurück",
      text: "Alle Übungen, der komplette Katalog an Alternativen, eigene Gewohnheiten und tiefgehende Analysen.",
    },
    exercises: {
      title: "Alle Übungen für die SOS-Pause",
      text: "Box-Atmung, Rückwärtszählen ab 100 und ehrliche Fragen – verschiedene Schlüssel für verschiedene Impulse.",
    },
    replacements: {
      title: "Der komplette Katalog an Mini-Alternativen",
      text: "Mehr Bewegung, Denkaufgaben und kurze Fakten – gesundes Dopamin für jeden Moment.",
    },
    custom: {
      title: "Eigene Alternativen und Gewohnheiten",
      text: "Fügen Sie hinzu, was für Sie funktioniert: Gitarre, Liegestütze, eine Buchseite.",
    },
    analytics: {
      title: "Tiefgehende Musteranalyse",
      text: "Erfahren Sie, zu welcher Uhrzeit und an welchem Wochentag der Feed am häufigsten gewinnt – und bereiten Sie sich darauf vor.",
    },
    history: {
      title: "Ihr gesamter Fortschritt",
      text: "Verlauf über 30 Tage und Heatmap über 16 Wochen – so sehen Sie, wie sich die Gewohnheit verändert.",
    },
    converter: {
      title: "Der komplette Zeitrechner",
      text: "Workouts, Sprachstunden und Gespräche mit Ihren Liebsten – Zeit, die Sie dem Feed abgerungen haben.",
    },
  },
  plans: {
    annual: "Jährlich",
    sixMonths: "6 Monate",
    threeMonths: "3 Monate",
    twoMonths: "2 Monate",
    monthly: "Monatlich",
    weekly: "Wöchentlich",
    lifetime: "Lebenslang",
    trial: (count: number, unit: PeriodUnit) =>
      `${count} ${selectPlural("de", count, PERIODS[unit])} kostenlos`,
    oneTime: "Einmalkauf",
    pricePerMonth: (price: string) => `≈ ${price} pro Monat`,
    perMonth: "pro Monat",
    perWeek: "pro Woche",
    savings: (percent: number) => `−${percent} %`,
  },
  unavailable: {
    demoTitle: "Demoversion: Zahlungen sind deaktiviert",
    devTitle: "Käufe sind in diesem Build nicht eingerichtet",
    title: "Käufe sind vorübergehend nicht verfügbar",
    demoText:
      "In der App aus dem App Store und von Google Play stehen hier die Tarife. Um die Pro-Funktionen anzusehen, aktivieren Sie Test-Pro.",
    devText:
      "Tragen Sie die RevenueCat-Schlüssel in .env.local ein (siehe .env.example) und starten Sie den Build neu – die Tarife erscheinen dann automatisch hier.",
    text: "Der Store ist nicht erreichbar. Versuchen Sie es später erneut – alle kostenlosen Funktionen bleiben verfügbar.",
    testProOff: "Test-Pro deaktivieren",
    testProOn: "Pro zum Testen aktivieren",
  },
  errors: {
    network:
      "Keine Verbindung zum Store. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
    alreadyPurchased: "Dieses Abo besteht bereits. Tippen Sie auf „Käufe wiederherstellen“.",
    notAllowed: "Käufe sind auf diesem Gerät oder in diesem Konto nicht erlaubt.",
    pending:
      "Die Zahlung wartet auf Bestätigung. Pro wird automatisch aktiviert, sobald sie durch ist.",
    planUnavailable: "Dieser Tarif ist in Ihrem Store derzeit nicht verfügbar.",
    generic: "Der Kauf konnte nicht abgeschlossen werden. Versuchen Sie es etwas später erneut.",
    noPlans: "Die Tarife sind noch nicht veröffentlicht. Schauen Sie etwas später wieder vorbei.",
    notActivated:
      "Die Zahlung ist erfolgt, aber Pro ist noch nicht aktiv. Versuchen Sie „Käufe wiederherstellen“.",
  },
};
