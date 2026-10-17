import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

/**
 * ai — German. The user is addressed as "Sie" throughout; nothing refers to the user's gender.
 * Weekday indexes are Monday-first (0 = Montag … 6 = Sonntag), month indexes are 0 = Januar.
 */

type Part = "morning" | "day" | "evening" | "night";
type Focus = Part | "all";

/** A number and its word never break apart: "3 Tage". */
const NB = " ";
/** "Wird geladen …" — German puts a space before the ellipsis; keep it on the same line. */
const DOTS = `${NB}…`;
const word = (value: number, forms: PluralForms) => selectPlural("de", value, forms);
const count = (value: number, forms: PluralForms) => `${value}${NB}${word(value, forms)}`;
const percent = (value: number) => `${value}${NB}%`;
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/**
 * Ends a sentence whose last word is a duration: German durations end with an abbreviation
 * ("40 Min.", "1 Std."), and its period also closes the sentence — never "1 Std..".
 */
const end = (text: string) => (text.endsWith(".") ? text : `${text}.`);

/** Nominative / accusative: "5 Tage". */
const DAYS: PluralForms = { one: "Tag", other: "Tage" };
/** Dative: "seit 5 Tagen", "aus 30 Tagen". */
const DAYS_DATIVE: PluralForms = { one: "Tag", other: "Tagen" };
const SLIPS: PluralForms = { one: "Ausrutscher", other: "Ausrutscher" };
/** Dative: "in 3 von 4 Fällen". */
const CASES_DATIVE: PluralForms = { one: "Fall", other: "Fällen" };
const TIMES: PluralForms = { one: "Mal", other: "Mal" };
/** Dative: "vor 3 Monaten". */
const MONTHS_DATIVE: PluralForms = { one: "Monat", other: "Monaten" };
const FILMS: PluralForms = { one: "Film", other: "Filme" };
const PAGES: PluralForms = { one: "Buchseite", other: "Buchseiten" };
const WALKS: PluralForms = { one: "Spaziergang", other: "Spaziergänge" };
const ENTRIES: PluralForms = { one: "Eintrag", other: "Einträge" };
/** Dative: "in 5 von 8 Einträgen". */
const ENTRIES_DATIVE: PluralForms = { one: "Eintrag", other: "Einträgen" };
const SHIFTS: PluralForms = { one: "Arbeitsschicht", other: "Arbeitsschichten" };

/** All weekdays are masculine: "der Dienstag", "keiner der letzten vier Dienstage". */
const WEEKDAY = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
/** "der letzten vier Dienstage" */
const WEEKDAY_PLURAL = [
  "Montage",
  "Dienstage",
  "Mittwoche",
  "Donnerstage",
  "Freitage",
  "Samstage",
  "Sonntage",
];
/** "Dienstags ist es meist ruhig" */
const WEEKDAY_ADVERB = [
  "Montags",
  "Dienstags",
  "Mittwochs",
  "Donnerstags",
  "Freitags",
  "Samstags",
  "Sonntags",
];

const NUMBER_WORDS = [
  "",
  "",
  "zwei",
  "drei",
  "vier",
  "fünf",
  "sechs",
  "sieben",
  "acht",
  "neun",
  "zehn",
  "elf",
  "zwölf",
];
/** "der letzten vier" — small numbers read better as words here. */
const numberWord = (value: number) => NUMBER_WORDS[value] || String(value);

/**
 * "3 der letzten vier Dienstage waren schwierig", "Keiner der letzten vier war schwierig",
 * "Der letzte Dienstag war schwierig". Without `noun` the weekday is implied.
 */
const hardOfLast = (hard: number, of: number, noun: string | null) => {
  if (of === 1) {
    return `Der letzte${noun ? ` ${noun}` : ""} war ${hard > 0 ? "schwierig" : "nicht schwierig"}`;
  }
  const last = `der letzten ${numberWord(of)}${noun ? ` ${noun}` : ""}`;
  if (hard === 0) return `Keiner ${last} war schwierig`;
  if (hard === of)
    return `Die letzten ${numberWord(of)}${noun ? ` ${noun}` : ""} waren alle schwierig`;
  if (hard === 1) return `Einer ${last} war schwierig`;
  return `${hard} ${last} waren schwierig`;
};

/** Habitual: "meist abends", "früher eher nachts". */
const ADVERB: Record<Part, string> = {
  morning: "morgens",
  day: "tagsüber",
  evening: "abends",
  night: "nachts",
};

/** Today's forecast: "vor allem am Abend". */
const TODAY: Record<Part, string> = {
  morning: "am Morgen",
  day: "tagsüber",
  evening: "am Abend",
  night: "in der Nacht",
};

const FOCUS: Record<Focus, string> = {
  morning: " morgens",
  day: " tagsüber",
  evening: " abends",
  night: " nachts",
  all: "",
};

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export const de: Messages = {
  yes: "Ja",
  no: "Nein",

  errors: {
    offline: "Keine Internetverbindung. Die Analyse geht weiter, sobald Sie wieder online sind.",
    timeout: "ChatGPT antwortet zu langsam. Wir versuchen es etwas später noch einmal.",
    busy: "Der Dienst ist gerade überlastet. Wir versuchen es in ein paar Minuten erneut.",
    unavailable:
      "ChatGPT ist gerade nicht erreichbar. Wir versuchen es in ein paar Minuten erneut.",
    server: "Der Server des KI-Coachs ist nicht erreichbar. Wir versuchen es später erneut.",
    unusable: "Die Antwort von ChatGPT ließ sich nicht verarbeiten. Wir versuchen es noch einmal.",
  },

  sync: {
    entry: `ChatGPT wertet den Eintrag aus${DOTS}`,
    deep: `ChatGPT wertet Ihren gesamten Verlauf neu aus${DOTS}`,
    translate: `ChatGPT übersetzt das Gedächtnis des Coachs in die neue Sprache${DOTS}`,
    retry: "Wiederholen",
    updated: (when: string) => `Analyse aktualisiert ${when}`,
    today: (time: string) => `heute um ${time}`,
    onDate: (date: string, time: string) => `am ${date} um ${time}`,
  },

  date: {
    month: (month: number, year: number) => `${MONTH_NAMES[month]} ${year}`,
    months: (fromMonth: number, fromYear: number, toMonth: number, toYear: number) =>
      fromYear === toYear && fromMonth === toMonth
        ? `${MONTH_NAMES[fromMonth]} ${fromYear}`
        : fromYear === toYear
          ? `${MONTH_NAMES[fromMonth]}–${MONTH_NAMES[toMonth]} ${toYear}`
          : `${MONTH_NAMES[fromMonth]} ${fromYear} – ${MONTH_NAMES[toMonth]} ${toYear}`,
  },

  impulse: {
    label: "Impuls",
    question: "Was ist passiert, bevor Sie den Feed öffnen wollten?",
    placeholder: `Beschreiben Sie in eigenen Worten, was passiert ist${DOTS}`,
    inputA11y: "Was ist passiert, bevor Sie den Feed öffnen wollten",
    outcomeLabel: "Wie ging es aus – falls Sie es schon wissen",
    resisted: "Widerstanden",
    opened: "Feed geöffnet",
    save: "Speichern",
    analysis: "Auswertung des Eintrags",
    hide: "Auswertung ausblenden",
    allAnalytics: "Alle KI-Analysen",
    sos: "SOS-Pause",
    notConfigured:
      "Eintrag gespeichert. In dieser Version ist die KI-Analyse nicht aktiv, daher liest ChatGPT ihn nicht.",
    needConsent:
      "Eintrag auf Ihrem Handy gespeichert. Damit ChatGPT ihn auswerten kann, brauchen wir Ihre Erlaubnis, Einträge zu senden.",
    allow: "Analyse erlauben",
    failed: "ChatGPT konnte den Eintrag nicht auswerten. Er ist gespeichert.",
    retry: "Erneut versuchen",
    analyzing: `Eintrag gespeichert. ChatGPT wertet ihn aus${DOTS}`,
  },

  entry: {
    cause: "Ursache",
    emotion: "Stimmung",
    context: "Situation",
    behavior: "Verhaltensmuster",
    colon: ": ",
    notEnough: (missing: string | null) =>
      missing
        ? `Für eine sichere Einschätzung fehlen noch Informationen: ${missing}`
        : "Für eine sichere Einschätzung reichen die Informationen noch nicht.",
  },

  history: {
    title: "Ihre Einträge",
    count: (value: number) => count(value, ENTRIES),
    more: "Mehr anzeigen",
    failed: "Auswertung fehlgeschlagen",
    waiting: "Wartet auf Auswertung",
    unclear: "Ursache unklar",
    resisted: " · widerstanden",
    opened: " · Feed geöffnet",
    retry: "Erneut auswerten",
    confirmDelete: "Eintrag löschen?",
    cancel: "Abbrechen",
    delete: "Löschen",
    deleteEntry: "Eintrag löschen",
  },

  screen: {
    overline: "Persönliche Analyse",
    title: "KI-Coach",
    preparing: "Analyse wird vorbereitet",
    startEntry:
      "Schreiben Sie zuerst auf der Startseite auf, was passiert ist, bevor Sie den Feed öffnen wollten.",
    studying:
      "ChatGPT sieht sich Ihren Verlauf an – erste Erkenntnisse erscheinen hier von selbst.",
    moreEntries:
      "Je mehr Einträge, desto genauer die Muster und Prognosen. Sie müssen nichts manuell starten.",
    notConnected: "Nicht verbunden",
    notConnectedTitle: "Die KI-Analyse ist in dieser Version nicht aktiv.",
    notConnectedText:
      "Einträge werden auf Ihrem Handy gespeichert. Sobald die App mit dem Server des KI-Coachs verbunden ist, wertet ChatGPT Ihren gesamten bisherigen Verlauf aus.",
    demoNote:
      "Dies ist eine Beispielansicht. In der Web-Demo ist ChatGPT nicht verbunden, daher sind die Texte unten nur Muster und keine Analyse Ihrer Daten. In der App erstellt ChatGPT sie aus Ihrem Verlauf.",
  },

  consent: {
    label: "Ihre Einwilligung",
    declined: "KI-Analyse ist ausgeschaltet – Einträge bleiben nur auf Ihrem Handy.",
    ask: "Damit der KI-Coach Ihre Gewohnheiten auswerten kann, brauchen wir Ihre Einwilligung",
    text: "Ihre Einträge, Antworten auf Fragen und Gewohnheitsstatistiken (Zeit im Feed, Ausrutscher, Erfolge – ohne Namen, E-Mail und Kontakte) werden über den StopScroll-Server an OpenAI gesendet und dort von ChatGPT analysiert. Laut den Richtlinien von OpenAI werden über die API gesendete Daten nicht zum Training von Modellen verwendet. Das Gedächtnis des Coachs und Ihr Verlauf bleiben nur auf Ihrem Handy. Sie können das jederzeit in den Einstellungen ausschalten.",
    allow: "Analyse erlauben",
    notNow: "Nicht jetzt",
  },

  question: {
    label: "Kurze Rückfrage",
    skip: "Überspringen",
  },

  highlights: {
    label: "Das Wichtigste vom KI-Coach",
    a11y: "Das Wichtigste vom KI-Coach, Analyse öffnen",
  },

  forecast: {
    title: "Prognose für heute",
    probabilityA11y: (value: number) =>
      `Wahrscheinlichkeit, heute den Feed zu öffnen: ${value} Prozent`,
    probabilityCaption: "Wahrscheinlichkeit, heute den Feed zu öffnen",
    helps: "Was heute hilft",
    updatedAt: (time: string) => `Aktualisiert um ${time}`,
    analytics: "Analyse",
    soon: "Die Prognose für heute erscheint in Kürze.",

    hardPart: {
      morning: "Am Morgen wird es wahrscheinlich schwierig.",
      day: "Tagsüber wird es wahrscheinlich schwierig.",
      evening: "Am Abend wird es wahrscheinlich schwierig.",
      night: "In der Nacht wird es wahrscheinlich schwierig.",
    },
    medium: (rest: boolean, part: Part | null) =>
      `${rest ? "Der Rest des Tages" : "Der Tag"} könnte schwierig werden${part ? ` – vor allem ${TODAY[part]}` : ""}.`,
    lowRest: "Der Rest des Tages dürfte ruhiger verlaufen.",
    low: "Es sieht nach einem ruhigen Tag aus.",
    preliminary: "Die Prognose ist noch vorläufig: Bisher gibt es wenig Daten.",
    passedHeadline: "Die schwierigste Zeit liegt für heute hinter Ihnen.",
    passed: (from: string, to: string) =>
      `Die kritische Zeit ${from}–${to} ist vorbei – und heute verlief sie ruhig.`,

    overLimit: (feed: string, limit: string) =>
      end(`Das Limit ist heute schon ausgeschöpft: ${feed} von ${limit}`),
    slipToday:
      "Heute gab es schon einen Ausrutscher – an solchen Tagen sind Impulse meist stärker.",
    openedToday:
      "Heute wurde der Feed schon geöffnet – an solchen Tagen sind Impulse meist stärker.",
    window: (inWindow: number, total: number, from: string, to: string) =>
      `Zwischen ${from} und ${to} ${inWindow === 1 ? "lag" : "lagen"} ${inWindow} von ${total} Ausrutschern und Einträgen der letzten zwei Monate.`,
    weekdayHard: (hard: number, of: number, weekday: number) =>
      `${hardOfLast(hard, of, of === 1 ? WEEKDAY[weekday]! : WEEKDAY_PLURAL[weekday]!)}.`,
    weekdayCalm: (hard: number, of: number, weekday: number) =>
      `${WEEKDAY_ADVERB[weekday]} ist es meist ruhig: ${hardOfLast(hard, of, null)}.`,
    afterHardUsuallyHard: (hard: number, of: number) =>
      `Gestern war ein schwieriger Tag – auf solche Tage folgt in ${hard} von ${count(of, CASES_DATIVE)} ein weiterer.`,
    afterHardUsuallyFine: (hard: number, of: number) =>
      `Gestern war ein schwieriger Tag, doch meist fangen Sie sich schnell wieder: Ein weiterer folgt in ${hard} von ${count(of, CASES_DATIVE)}.`,
    afterHard: "Gestern war ein schwieriger Tag.",
    recentSlips: (slips: number) =>
      `In den letzten drei Tagen gab es ${count(slips, SLIPS)} – die Impulse sind gerade stärker als sonst.`,
    streak: (days: number) => `Seit ${count(days, DAYS_DATIVE)} halten Sie Ihr Limit ein.`,
    calmWeek: "In der letzten Woche hat der Feed kein einziges Mal gewonnen.",
    plan: (from: string, to: string) =>
      `Legen Sie vorab fest, womit Sie die Zeit von ${from} bis ${to} statt mit dem Feed füllen.`,
    needDays: (min: number, have: number) =>
      `Die Prognose braucht mindestens ${count(min, DAYS)} mit Einträgen in den letzten vier Wochen – bisher ${have === 0 ? "gibt es noch keinen" : `haben Sie ${have}`}.`,
    noSignals: "Heute gibt es keine klaren Risikosignale.",
    windowRest: (to: string) =>
      `Wenn Sie den Feed bis ${to} nicht mehr öffnen, verläuft der Rest des Tages ruhiger.`,
    windowDay: (to: string) =>
      `Wenn Sie den Feed bis ${to} nicht öffnen, steigt die Chance auf einen ruhigen Tag deutlich.`,
    basis: (days: number) => `Daten aus ${count(days, DAYS_DATIVE)}`,
  },

  analytics: {
    conclusion: "Fazit",
    warnings: "Kritische Phasen",
    changes: "Was sich verändert",
    causes: "Häufige Ursachen",
    situations: "Wiederkehrende Situationen",
    emotions: "Gefühlslagen",
    times: "Kritische Zeiten und Tage",
    hypotheses: "Hypothesen",
    confidence: {
      low: "Schwache Hinweise",
      medium: "Deutliche Hinweise",
      high: "Starke Hinweise",
    },
    notFact: "noch eine Vermutung, kein Fakt",
    confirmed: "geprüft und bestätigt",
    self: "Sie gegen sich selbst",
    saved: "Zurückgewonnene Zeit",
    memory: "Langzeitgedächtnis",

    conclusionPending: "Das Fazit erscheint nach der nächsten Analyse Ihres Verlaufs.",
    fewDays: "Noch gibt es wenig Daten – in ein paar Wochen werden die Erkenntnisse genauer.",
    fewEntries:
      "Noch gibt es wenige Einträge: Ursachen und Situationen werden mit mehr Einträgen genauer.",

    causeNote: (value: number, of: number, part: Part | null) =>
      `${value} von ${count(of, CASES_DATIVE)}${part ? `, meist ${ADVERB[part]}` : ""}`,

    slipsDown: (recent: number, previous: number) =>
      `Weniger Ausrutscher: ${recent} in den letzten zwei Wochen, ${previous} in den zwei davor.`,
    slipsUp: (recent: number, previous: number) =>
      `Mehr Ausrutscher: ${recent} in den letzten zwei Wochen, ${previous} in den zwei davor.`,
    feedDown: (week: string, before: string) =>
      end(
        `Weniger Zeit im Feed: in der letzten Woche im Schnitt ${week} pro Tag, in der Woche davor ${before}`,
      ),
    feedUp: (week: string, before: string) =>
      end(
        `Mehr Zeit im Feed: in der letzten Woche im Schnitt ${week} pro Tag, in der Woche davor ${before}`,
      ),
    heldMore: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Sie widerstehen öfter: in ${resisted} von ${count(of, ENTRIES_DATIVE)} der letzten zwei Wochen, davor in ${before} von ${beforeOf}.`,
    heldLess: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Widerstehen fällt schwerer: in ${resisted} von ${count(of, ENTRIES_DATIVE)} der letzten zwei Wochen, davor in ${before} von ${beforeOf}.`,

    calmSame: (value: number) =>
      `Diesen Monat gibt es so viele ruhige Tage wie im Vormonat: ${percent(value)}.`,
    calmVs: (value: number, before: number) =>
      `Diesen Monat sind ${percent(value)} der Tage ruhig, im Vormonat waren es ${percent(before)}.`,
    weekVsUsual: (week: number, usual: string) =>
      `In den letzten 7 Tagen: ${count(week, SLIPS)}, im Monat davor im Schnitt ${usual} pro Woche.`,
    streakRecord: (days: number) => `Aktuelle Serie: ${count(days, DAYS)} – Ihr Rekord.`,
    streakBest: (days: number, best: number) =>
      `Aktuelle Serie: ${count(days, DAYS)}, Ihre beste: ${count(best, DAYS)}.`,

    hardestMoved: (before: number, now: number) =>
      `Ihr schwierigster Wochentag war früher der ${WEEKDAY[before]}, jetzt ist es der ${WEEKDAY[now]}.`,
    partMoved: (before: Part, now: Part) =>
      `Ihre Ausrutscher haben sich verschoben: früher eher ${ADVERB[before]}, jetzt ${ADVERB[now]}.`,
    feedVsMonthsAgo: (now: string, before: string, months: number) =>
      end(
        `Im Schnitt ${now} pro Tag im Feed – vor ${count(months, MONTHS_DATIVE)} waren es ${before}`,
      ),
    bestStreak: (days: number) => `Beste Serie: ${count(days, DAYS)} innerhalb des Limits.`,
    longestCalm: (days: number) => `Längste Zeit ohne Ausrutscher: ${count(days, DAYS)}.`,
    years: (before: number, beforeShare: number, year: number, share: number) =>
      `Anteil schwieriger Tage: ${percent(beforeShare)} im Jahr ${before}, ${percent(share)} im Jahr ${year}.`,

    chapter: (month: string, note: string, calm: number | null) =>
      `${cap(month)}: ${note}${calm === null ? "" : ` Ruhige Tage: ${percent(calm)}.`}`,
    correction: (was: string, now: string, why: string | null) =>
      `Früher: ${was}. Jetzt genauer: ${now}${why ? ` (${why})` : ""}.`,
    scoped: (text: string, period: string) => `${text} (${period}; inzwischen nicht mehr).`,
    event: (date: string, note: string) => `${date}: ${note}`,

    savedHeadline: (duration: string) => `Sie haben ${duration} zurückgewonnen.`,
    films: (films: number) => `etwa ${count(films, FILMS)}`,
    oneShift: "eine ganze Arbeitsschicht",
    shifts: (shifts: number) => count(shifts, SHIFTS),
    walks: (walks: number) => `${count(walks, WALKS)} à 30${NB}Minuten`,
    pages: (pages: number) => count(pages, PAGES),

    windowNote: (inWindow: number, total: number) =>
      `Hier ${inWindow === 1 ? "lag" : "lagen"} ${inWindow} von ${total} Ausrutschern und Einträgen der letzten zwei Monate.`,
    weekdayTitle: (weekday: number) => WEEKDAY[weekday]!,
    weekdayNote: (hard: number, of: number, weekday: number) =>
      `${hardOfLast(hard, of, of === 1 ? WEEKDAY[weekday]! : WEEKDAY_PLURAL[weekday]!)}.`,
    afterRuns: (slipped: number, runs: number) =>
      `Auf ${slipped} von ${runs} ruhigen ${runs === 1 ? "Serie" : "Serien"} ab 4${NB}Tagen folgte innerhalb von drei Tagen ein schwieriger Tag.`,
  },

  challenge: {
    label: "AI Challenge",
    proposed: "Versuchen wir ein kleines Experiment",
    day: (day: number, of: number) => `Experiment · Tag ${day} von ${of}`,
    pastResult: "Ergebnis des letzten Experiments",
    result: "Ergebnis des Experiments",
    duration: (days: number) => `Für ${count(days, DAYS)}.`,
    try: "Ausprobieren",
    notNow: "Nicht jetzt",
    daysA11y: "Tage des Experiments",
    todayQuestion: "Hat es heute geklappt?",
    managed: "Geklappt",
    missed: "Nicht geklappt",
    managedToday: "Heute hat es geklappt – vermerkt.",
    missedToday: "Heute hat es nicht geklappt – auch das zählt fürs Ergebnis.",
    reviewing: `Experiment beendet. Wir vergleichen die Tage davor und währenddessen${DOTS}`,
    finished: "Experiment beendet.",

    review: {
      managed: (days: number, of: number) =>
        `An ${days} von ${count(of, DAYS_DATIVE)} hat es geklappt.`,
      noData:
        "Für die Tage des Experiments gibt es keine Einträge – ein Vergleich ist noch nicht möglich.",
      losses: (focus: Focus, during: number, before: number, days: number, change: number | null) =>
        `${days === 1 ? "Am Tag des Experiments" : `In den ${count(days, DAYS_DATIVE)} des Experiments`} hat der Feed${FOCUS[focus]} ${count(during, TIMES)} gewonnen, ${days === 1 ? "am Tag davor" : `in den ${count(days, DAYS_DATIVE)} davor`} ${count(before, TIMES)}${
          change === null ? "" : ` (${change > 0 ? "+" : "−"}${percent(Math.abs(change))})`
        }.`,
      feed: (during: string, before: string) =>
        end(`Zeit im Feed: im Schnitt ${during} pro Tag, davor ${before}`),
      fewBefore: "Für die Zeit davor gibt es wenig Daten, der Vergleich ist daher vorläufig.",
      helps: "Das scheint zu helfen – es lohnt sich, dabei zu bleiben.",
      same: "Noch ist kein Unterschied zu sehen – vielleicht braucht es mehr Tage.",
      worse: "Leichter war es an diesen Tagen nicht – der Grund liegt wohl woanders.",
    },
  },

  demo: {
    forecast: {
      headline: "Am Abend wird es wahrscheinlich schwierig.",
      reasons: [
        "An den letzten drei Sonntagen haben Sie den Feed zwischen 21:00 und 23:00 geöffnet.",
        "In den letzten drei Tagen gab es drei Ausrutscher – mehr als für diese Woche üblich.",
        "Die meisten Ausrutscher im letzten Monat passierten spätabends aus Müdigkeit.",
      ],
      window:
        "Wenn Sie den Feed bis 23:00 nicht öffnen, steigt die Chance auf einen ruhigen Tag deutlich.",
      advice: "Legen Sie Ihr Handy gegen 21:00 zum Laden in ein anderes Zimmer.",
      basis: "Beispiel",
    },
    analytics: {
      conclusion:
        "Der Feed gewinnt offenbar meist nicht aus Langeweile, sondern wegen der Müdigkeit am Abend nach einem langen Tag. Tagsüber halten Sie deutlich besser durch als vor einem Monat.",
      dataNote: "Für Aussagen über das Wochenende gibt es noch zu wenige Einträge.",
      warning:
        "Nach 5+ ruhigen Tagen am Stück kam es bei Ihnen zweimal am Wochenende zu einem Rückschlag.",
      improvement:
        "In den letzten zwei Wochen öffnen Sie den Feed tagsüber immer seltener: 2 Ausrutscher statt 6.",
      worsening:
        "Späte Abende sind schwieriger geworden: 4 der letzten 5 Ausrutscher waren nach 22:00.",
      habitChange:
        "Am stärksten verändert hat sich im letzten Monat die Gewohnheit nach der Arbeit – sie ist ruhiger geworden.",
      causes: [
        { title: "Müdigkeit", note: "Meist nach 21:00 an Werktagen." },
        { title: "Langeweile", note: "Vor allem tagsüber, in Pausen." },
        { title: "Autopilot", note: "Öffnen ohne Anlass, direkt nach dem Entsperren." },
      ],
      situation: { title: "Nach der Arbeit, zu Hause", note: "Kommt in 6 von 14 Einträgen vor." },
      emotion: { title: "Innere Leere", note: "Taucht in fast allen Abendeinträgen auf." },
      time: { title: "21:00–23:00", note: "Hier lagen 15 von 17 Ausrutschern des Monats." },
      weekday: { title: "Sonntag", note: "Drei Wochen in Folge der schwierigste Tag." },
      hypothesis:
        "Abendspaziergänge scheinen das Risiko zu senken, den Feed zu öffnen: Nach fünf Spaziergängen gab es keine Ausrutscher.",
      selfComparison: "Diesen Monat gab es 24 % mehr ruhige Tage als im Vormonat.",
      longTerm: [
        "Früher: Der Feed gewinnt aus Langeweile in der Mittagspause. Jetzt genauer: aus Müdigkeit spätabends (das zeigen die Einträge des letzten Monats).",
        "Beste Serie: 9 Tage innerhalb des Limits.",
      ],
      savedHeadline: "Sie haben fast 17 Stunden zurückgewonnen.",
      equivalents: ["etwa acht Filme", "zwei Arbeitsschichten", "34 Spaziergänge à 30 Minuten"],
    },
    challenge: {
      title: "Kein Handy im Schlafzimmer",
      description:
        "Lassen Sie Ihr Handy an drei Abenden in Folge ab 22:30 außerhalb des Schlafzimmers laden.",
      expectation: "Wir schauen, ob es dann weniger späte Ausrutscher gibt.",
    },
  },
};
