import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

/*
 * French typography: a no-break space ( ) goes before « : ; ? ! % » and between a number
 * and its word. French uses the singular for 0 and 1 ("0 écart", "1 jour").
 * The coach says "vous" and never agrees an adjective or a participle with the user.
 */

type Part = "morning" | "day" | "evening" | "night";
type Focus = Part | "all";

/** A number and its word never break apart: "3 jours". */
const NB = " ";
const word = (value: number, forms: PluralForms) => selectPlural("fr", value, forms);
const count = (value: number, forms: PluralForms) => `${value}${NB}${word(value, forms)}`;
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const DAYS: PluralForms = { one: "jour", other: "jours" };
const RECORDED_DAYS: PluralForms = { one: "jour renseigné", other: "jours renseignés" };
const SLIPS: PluralForms = { one: "écart", other: "écarts" };
const TIMES: PluralForms = { one: "fois", other: "fois" };
const MONTHS: PluralForms = { one: "mois", other: "mois" };
const FILMS: PluralForms = { one: "film", other: "films" };
const PAGES: PluralForms = { one: "page", other: "pages" };
const WALKS: PluralForms = {
  one: "promenade de 30 minutes",
  other: "promenades de 30 minutes",
};
const ENTRIES: PluralForms = { one: "entrée", other: "entrées" };
const SHIFTS: PluralForms = { one: "journée de travail", other: "journées de travail" };

/** The verb after "1 des 4 …" / "3 des 4 …". */
const WAS_HARD: PluralForms = { one: "a été difficile", other: "ont été difficiles" };
const HAPPENED: PluralForms = { one: "a eu lieu", other: "ont eu lieu" };

/** "une fois", "3 fois" */
const times = (value: number) => (value === 1 ? "une fois" : count(value, TIMES));
/** "3 fois sur 5", "une fois sur 4" */
const outOf = (value: number, of: number) => `${times(value)} sur ${of}`;

const WEEKDAY = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
/** "les 4 derniers mardis" */
const WEEKDAY_PLURAL = [
  "lundis",
  "mardis",
  "mercredis",
  "jeudis",
  "vendredis",
  "samedis",
  "dimanches",
];

/** "3 des 4 derniers mardis ont été difficiles." */
const hardWeekdays = (hard: number, of: number, weekday: number) => {
  const days = WEEKDAY_PLURAL[weekday];
  if (of <= 1) {
    const day = cap(WEEKDAY[weekday] ?? "");
    return hard > 0 ? `${day} dernier a été difficile.` : `${day} dernier n’a pas été difficile.`;
  }
  if (hard === 0) return `Aucun des ${of}${NB}derniers ${days} n’a été difficile.`;
  if (hard >= of) return `Les ${of}${NB}derniers ${days} ont tous été difficiles.`;
  return `${hard} des ${of}${NB}derniers ${days} ${word(hard, WAS_HARD)}.`;
};

/** "seulement 1 des 5 derniers a été difficile" — after "Les mardis sont généralement calmes". */
const calmWeekdays = (hard: number, of: number) => {
  if (of <= 1) return hard > 0 ? "le dernier a été difficile" : "le dernier n’a pas été difficile";
  if (hard === 0) return `aucun des ${of}${NB}derniers n’a été difficile`;
  if (hard >= of) return `les ${of}${NB}derniers ont tous été difficiles`;
  return `seulement ${hard} des ${of}${NB}derniers ${word(hard, WAS_HARD)}`;
};

const ADVERB: Record<Part, string> = {
  morning: "le matin",
  day: "l’après-midi",
  evening: "le soir",
  night: "la nuit",
};

const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export const fr: Messages = {
  yes: "Oui",
  no: "Non",

  errors: {
    offline: "Pas de connexion Internet. L’analyse reprendra dès le retour du réseau.",
    timeout: "ChatGPT met trop de temps à répondre. Nous réessaierons un peu plus tard.",
    busy: "Le service est surchargé pour le moment. Nous réessaierons dans quelques minutes.",
    unavailable:
      "ChatGPT est indisponible pour le moment. Nous réessaierons dans quelques minutes.",
    server: "Le serveur du coach IA est indisponible. Nous réessaierons plus tard.",
    unusable: "La réponse de ChatGPT n’a pas pu être lue. Nous allons réessayer.",
  },

  sync: {
    entry: "ChatGPT analyse votre entrée…",
    deep: "ChatGPT met à jour l’analyse de tout votre historique…",
    translate: "ChatGPT traduit la mémoire du coach dans la nouvelle langue…",
    retry: "Réessayer",
    updated: (when: string) => `Analyses mises à jour ${when}`,
    today: (time: string) => `aujourd’hui à ${time}`,
    onDate: (date: string, time: string) => `le ${date} à ${time}`,
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
    label: "Envie",
    question: "Que s’est-il passé juste avant l’envie d’ouvrir le fil ?",
    placeholder: "Décrivez avec vos mots ce qui s’est passé…",
    inputA11y: "Que s’est-il passé juste avant l’envie d’ouvrir le fil",
    outcomeLabel: "Comment ça s’est terminé — si vous le savez déjà",
    resisted: "J’ai tenu bon",
    opened: "J’ai ouvert le fil",
    save: "Enregistrer",
    analysis: "Analyse de l’entrée",
    hide: "Masquer l’analyse",
    allAnalytics: "Toutes les analyses IA",
    sos: "Pause SOS",
    notConfigured:
      "Entrée enregistrée. L’analyse IA n’est pas connectée dans cette version, ChatGPT ne la lira donc pas.",
    needConsent:
      "Entrée enregistrée sur le téléphone. Pour que ChatGPT l’analyse, nous avons besoin de votre accord pour envoyer les entrées.",
    allow: "Autoriser l’analyse",
    failed: "Impossible d’obtenir l’analyse de ChatGPT. L’entrée est enregistrée.",
    retry: "Réessayer",
    analyzing: "Entrée enregistrée. ChatGPT l’analyse…",
  },

  entry: {
    cause: "Cause",
    emotion: "Ressenti",
    context: "Situation",
    behavior: "Comportement",
    colon: " : ",
    notEnough: (missing: string | null) =>
      missing
        ? `Pas encore assez d’informations pour conclure avec certitude : ${missing}`
        : "Pas encore assez d’informations pour conclure avec certitude.",
  },

  history: {
    title: "Historique des entrées",
    count: (value: number) => count(value, ENTRIES),
    more: "Afficher plus",
    failed: "Analyse non reçue",
    waiting: "En attente d’analyse",
    unclear: "Cause incertaine",
    resisted: " · tenu bon",
    opened: " · fil ouvert",
    retry: "Relancer l’analyse",
    confirmDelete: "Supprimer l’entrée ?",
    cancel: "Annuler",
    delete: "Supprimer",
    deleteEntry: "Supprimer l’entrée",
  },

  screen: {
    overline: "Analyses personnalisées",
    title: "Coach IA",
    preparing: "Analyse en préparation",
    startEntry:
      "Commencez par une entrée sur l’écran Accueil : ce qui s’est passé juste avant l’envie d’ouvrir le fil.",
    studying:
      "ChatGPT étudie votre historique — les premières conclusions apparaîtront ici d’elles-mêmes.",
    moreEntries:
      "Plus vous ajoutez d’entrées, plus les tendances et les prévisions sont précises. Rien à lancer manuellement.",
    notConnected: "Non connecté",
    notConnectedTitle: "L’analyse IA n’est pas connectée dans cette version.",
    notConnectedText:
      "Les entrées sont enregistrées sur le téléphone. Une fois l’application reliée au serveur du coach IA, ChatGPT analysera tout l’historique accumulé.",
    demoNote:
      "Ceci est un exemple d’écran. ChatGPT n’est pas connecté dans la démo web : les textes ci-dessous sont un modèle, pas une analyse de vos données. Dans l’application, ChatGPT les rédige à partir de votre historique.",
  },

  consent: {
    label: "Votre autorisation",
    declined: "L’analyse IA est désactivée — les entrées restent uniquement sur le téléphone.",
    ask: "Le coach IA a besoin de votre autorisation pour étudier vos habitudes",
    text: "Vos entrées, vos réponses aux questions et les statistiques de vos habitudes (temps passé sur le fil, écarts, victoires — sans nom, e-mail ni contacts) seront envoyées via le serveur StopScroll à OpenAI, où ChatGPT les analyse. Selon les règles d’OpenAI, les données envoyées via l’API ne servent pas à entraîner les modèles. La mémoire du coach et l’historique sont stockés uniquement sur votre téléphone. Vous pouvez désactiver l’analyse à tout moment dans les Réglages.",
    allow: "Autoriser l’analyse",
    notNow: "Pas maintenant",
  },

  question: {
    label: "Question pour affiner",
    skip: "Passer",
  },

  highlights: {
    label: "L’essentiel du coach IA",
    a11y: "L’essentiel du coach IA, ouvrir les analyses",
  },

  forecast: {
    title: "Prévision du jour",
    probabilityA11y: (percent: number) =>
      `Probabilité d’ouvrir le fil aujourd’hui : ${percent} pour cent`,
    probabilityCaption: "probabilité d’ouvrir le fil aujourd’hui",
    helps: "Ce qui peut aider aujourd’hui",
    updatedAt: (time: string) => `Mise à jour à ${time}`,
    analytics: "Analyses",
    soon: "La prévision du jour arrivera bientôt.",

    hardPart: {
      morning: "La matinée s’annonce difficile.",
      day: "L’après-midi s’annonce difficile.",
      evening: "La soirée s’annonce difficile.",
      night: "La nuit s’annonce difficile.",
    },
    medium: (rest: boolean, part: Part | null) =>
      `${rest ? "Le reste de la journée" : "La journée"} pourrait être difficile${part ? `, surtout ${ADVERB[part]}` : ""}.`,
    lowRest: "Le reste de la journée devrait être plus calme.",
    low: "La journée s’annonce calme.",
    preliminary: "La prévision reste provisoire : l’historique est encore court.",
    passedHeadline: "Le moment le plus difficile de la journée est passé.",
    passed: (from: string, to: string) =>
      `Le créneau à risque ${from}–${to} est passé, et il s’est déroulé dans le calme aujourd’hui.`,

    overLimit: (feed: string, limit: string) =>
      `La limite du jour est déjà dépassée : ${feed} sur ${limit}.`,
    slipToday:
      "Il y a déjà eu un écart aujourd’hui — ces jours-là, les envies sont souvent plus fortes.",
    openedToday:
      "Le fil a déjà été ouvert aujourd’hui — ces jours-là, les envies sont souvent plus fortes.",
    window: (inWindow: number, total: number, from: string, to: string) =>
      inWindow === 0
        ? `Aucun de vos ${total} écarts et entrées des deux derniers mois n’a eu lieu entre ${from} et ${to}.`
        : `${inWindow} de vos ${total} écarts et entrées des deux derniers mois ${word(inWindow, HAPPENED)} entre ${from} et ${to}.`,
    weekdayHard: hardWeekdays,
    weekdayCalm: (hard: number, of: number, weekday: number) =>
      `Les ${WEEKDAY_PLURAL[weekday]} sont généralement calmes : ${calmWeekdays(hard, of)}.`,
    afterHardUsuallyHard: (hard: number, of: number) =>
      `Hier a été une journée difficile, et le lendemain d’une telle journée l’est aussi ${outOf(hard, of)}.`,
    afterHardUsuallyFine: (hard: number, of: number) =>
      `Hier a été une journée difficile, mais vous rebondissez vite d’habitude : ${
        hard === 0
          ? `aucun des ${of}${NB}lendemains n’a été difficile`
          : `le lendemain n’est difficile ${hard === 1 ? "qu’" : "que "}${outOf(hard, of)}`
      }.`,
    afterHard: "Hier a été une journée difficile.",
    recentSlips: (slips: number) =>
      `Il y a eu ${count(slips, SLIPS)} ces trois derniers jours — les envies sont plus fortes que d’habitude en ce moment.`,
    streak: (days: number) => `Vous restez dans votre limite depuis ${count(days, DAYS)}.`,
    calmWeek: "Le fil n’a pas gagné une seule fois ces sept derniers jours.",
    plan: (from: string, to: string) =>
      `Décidez à l’avance de ce que vous ferez de ${from} à ${to} au lieu d’ouvrir le fil.`,
    needDays: (min: number, have: number) =>
      `Pour une prévision, il faut au moins ${count(min, RECORDED_DAYS)} sur quatre semaines — ${
        have === 0 ? "aucun" : have
      } pour l’instant.`,
    noSignals: "Pas de signal de risque évident aujourd’hui.",
    windowRest: (to: string) =>
      `Si vous parvenez à ne plus ouvrir le fil avant ${to}, le reste de la journée sera plus calme.`,
    windowDay: (to: string) =>
      `Si vous parvenez à ne pas ouvrir le fil avant ${to}, vos chances d’une journée calme augmentent nettement.`,
    basis: (days: number) => `historique de ${count(days, DAYS)}`,
  },

  analytics: {
    conclusion: "Conclusion générale",
    warnings: "Périodes à risque",
    changes: "Ce qui change",
    causes: "Causes fréquentes",
    situations: "Situations récurrentes",
    emotions: "États émotionnels",
    times: "Heures et jours à risque",
    hypotheses: "Hypothèses",
    confidence: {
      low: "Indices faibles",
      medium: "Indices notables",
      high: "Indices solides",
    },
    notFact: "encore une supposition, pas un fait",
    confirmed: "confirmé par un test",
    self: "Vous face à vous-même",
    saved: "Le temps que vous avez récupéré",
    memory: "Mémoire à long terme",

    conclusionPending: "Les conclusions apparaîtront après la prochaine analyse de l’historique.",
    fewDays: "Encore peu de données — les conclusions gagneront en précision d’ici deux semaines.",
    fewEntries:
      "Encore peu d’entrées : les causes et les situations gagneront en précision à mesure que vous en ajouterez.",

    causeNote: (value: number, of: number, part: Part | null) =>
      `${value}${NB}cas sur ${of}${part ? `, le plus souvent ${ADVERB[part]}` : ""}`,

    slipsDown: (recent: number, previous: number) =>
      `Les écarts diminuent : ${recent} ces deux dernières semaines, contre ${previous} les deux précédentes.`,
    slipsUp: (recent: number, previous: number) =>
      `Les écarts augmentent : ${recent} ces deux dernières semaines, contre ${previous} les deux précédentes.`,
    feedDown: (week: string, before: string) =>
      `Le temps passé sur le fil baisse : ${week} par jour en moyenne cette semaine, contre ${before} la semaine d’avant.`,
    feedUp: (week: string, before: string) =>
      `Le temps passé sur le fil augmente : ${week} par jour en moyenne cette semaine, contre ${before} la semaine d’avant.`,
    heldMore: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Vous résistez plus souvent : ${count(resisted, ENTRIES)} sur ${of} ces deux dernières semaines, contre ${before} sur ${beforeOf} auparavant.`,
    heldLess: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Résister devient plus difficile : ${count(resisted, ENTRIES)} sur ${of} ces deux dernières semaines, contre ${before} sur ${beforeOf} auparavant.`,

    calmSame: (percent: number) =>
      `Autant de jours calmes ce mois-ci que le mois dernier : ${percent} %.`,
    calmVs: (percent: number, before: number) =>
      `Jours calmes ce mois-ci : ${percent} %, contre ${before} % le mois dernier.`,
    weekVsUsual: (week: number, usual: string) =>
      `${count(week, SLIPS)} ces 7${NB}derniers jours ; le mois dernier, ${usual} par semaine en moyenne.`,
    streakRecord: (days: number) => `Série en cours : ${count(days, DAYS)} — votre record.`,
    streakBest: (days: number, best: number) =>
      `Série en cours : ${count(days, DAYS)}, meilleure série : ${count(best, DAYS)}.`,

    hardestMoved: (before: number, now: number) =>
      `Le jour le plus difficile de la semaine était le ${WEEKDAY[before]} ; c’est désormais le ${WEEKDAY[now]}.`,
    partMoved: (before: Part, now: Part) =>
      `Vos écarts se sont déplacés : avant, c’était surtout ${ADVERB[before]}, désormais ${ADVERB[now]}.`,
    feedVsMonthsAgo: (now: string, before: string, months: number) =>
      `Temps moyen sur le fil : ${now} par jour, contre ${before} il y a ${count(months, MONTHS)}.`,
    bestStreak: (days: number) => `Meilleure série : ${count(days, DAYS)} dans votre limite.`,
    longestCalm: (days: number) => `Plus longue période sans écart : ${count(days, DAYS)}.`,
    years: (before: number, beforeShare: number, year: number, share: number) =>
      `En ${before}, ${beforeShare} % des jours ont été difficiles ; en ${year}, ${share} %.`,

    chapter: (month: string, note: string, calm: number | null) =>
      `${cap(month)} : ${note}${calm === null ? "" : ` Jours calmes : ${calm} %.`}`,
    correction: (was: string, now: string, why: string | null) =>
      `Avant : ${was}. Désormais, plus précisément : ${now}${why ? ` (${why})` : ""}.`,
    scoped: (text: string, period: string) => `${text} (${period} ; ce n’est plus le cas).`,
    event: (date: string, note: string) => `${cap(date)} : ${note}`,

    savedHeadline: (duration: string) => `Vous avez récupéré ${duration}.`,
    films: (films: number) => `environ ${count(films, FILMS)}`,
    oneShift: "une journée de travail entière",
    shifts: (shifts: number) => count(shifts, SHIFTS),
    walks: (walks: number) => count(walks, WALKS),
    pages: (pages: number) => `${count(pages, PAGES)} de livre`,

    windowNote: (inWindow: number, total: number) =>
      inWindow === 0
        ? `Ce créneau ne regroupe aucun de vos ${total} écarts et entrées des deux derniers mois.`
        : `Ce créneau regroupe ${inWindow} de vos ${total} écarts et entrées des deux derniers mois.`,
    weekdayTitle: (weekday: number) => cap(WEEKDAY[weekday] ?? ""),
    weekdayNote: hardWeekdays,
    afterRuns: (slipped: number, runs: number) =>
      `${cap(outOf(slipped, runs))}, une série calme d’au moins 4${NB}jours a été suivie d’une journée difficile dans les trois jours.`,
  },

  challenge: {
    label: "AI Challenge",
    proposed: "Essayons une petite expérience",
    day: (day: number, of: number) => `Expérience · jour ${day} sur ${of}`,
    pastResult: "Résultat de l’expérience précédente",
    result: "Résultat de l’expérience",
    duration: (days: number) => `Pendant ${count(days, DAYS)}.`,
    try: "Essayer",
    notNow: "Pas maintenant",
    daysA11y: "Jours de l’expérience",
    todayQuestion: "Avez-vous réussi aujourd’hui ?",
    managed: "Réussi",
    missed: "Pas réussi",
    managedToday: "Réussi aujourd’hui — c’est noté.",
    missedToday: "Pas réussi aujourd’hui — c’est aussi une donnée pour le bilan.",
    reviewing: "Expérience terminée. Comparaison des jours avant et pendant l’expérience…",
    finished: "Expérience terminée.",

    review: {
      managed: (days: number, of: number) => `Vous avez réussi ${count(days, DAYS)} sur ${of}.`,
      noData: "Aucune donnée pour les jours de l’expérience, donc rien à comparer pour l’instant.",
      losses: (focus: Focus, during: number, before: number, days: number, change: number | null) =>
        `${
          during === 0 ? "Le fil n’a pas gagné une seule fois" : `Le fil a gagné ${times(during)}`
        }${focus === "all" ? "" : ` ${ADVERB[focus]}`} en ${count(days, DAYS)} d’expérience, contre ${times(before)} ${
          days === 1 ? "la veille" : `les ${count(days, DAYS)} précédents`
        }${change === null ? "" : ` (${change > 0 ? "+" : "−"}${Math.abs(change)} %)`}.`,
      feed: (during: string, before: string) =>
        `Temps sur le fil : ${during} par jour en moyenne, contre ${before}.`,
      fewBefore: "Peu de données avant l’expérience : la comparaison reste provisoire.",
      helps: "Cela semble aider — une approche à garder.",
      same: "Pas de différence visible pour l’instant — il faudra peut-être plus de jours.",
      worse: "Ces jours n’ont pas été plus faciles — la cause est sans doute ailleurs.",
    },
  },

  demo: {
    forecast: {
      headline: "La soirée s’annonce difficile.",
      reasons: [
        "Ces trois derniers dimanches, vous avez ouvert le fil entre 21:00 et 23:00.",
        "Il y a eu trois écarts ces trois derniers jours — plus que d’habitude pour cette semaine.",
        "Ce mois-ci, la plupart des écarts ont eu lieu tard le soir, sur fond de fatigue.",
      ],
      window:
        "Si vous parvenez à ne pas ouvrir le fil avant 23:00, vos chances d’une journée calme augmentent nettement.",
      advice: "Mettez votre téléphone à charger dans une autre pièce vers 21:00.",
      basis: "exemple",
    },
    analytics: {
      conclusion:
        "Le fil semble l’emporter le plus souvent non par ennui, mais à cause de la fatigue du soir après une longue journée. En journée, vous tenez nettement mieux qu’il y a un mois.",
      dataNote: "Pas encore assez d’entrées pour tirer des conclusions sur les week-ends.",
      warning:
        "Après une série d’au moins 5 jours calmes, vous avez rechuté deux fois le week-end.",
      improvement:
        "Ces deux dernières semaines, vous ouvrez de moins en moins le fil en journée : 2 écarts contre 6.",
      worsening:
        "Les fins de soirée sont devenues plus difficiles : 4 des 5 derniers écarts ont eu lieu après 22:00.",
      habitChange:
        "En un mois, c’est l’habitude d’après le travail qui a le plus changé — elle est devenue plus calme.",
      causes: [
        { title: "Fatigue", note: "Surtout après 21:00 en semaine." },
        { title: "Ennui", note: "Plutôt en journée, pendant les pauses." },
        {
          title: "Pilote automatique",
          note: "Ouverture sans raison, juste après le déverrouillage.",
        },
      ],
      situation: { title: "Après le travail, à la maison", note: "Revient dans 6 entrées sur 14." },
      emotion: {
        title: "Sentiment de vide",
        note: "Présent dans presque toutes les entrées du soir.",
      },
      time: { title: "21:00–23:00", note: "Ce créneau regroupe 15 des 17 écarts du mois." },
      weekday: { title: "Dimanche", note: "Le jour le plus difficile trois semaines de suite." },
      hypothesis:
        "Les promenades du soir semblent réduire la probabilité d’ouvrir le fil : aucun écart après cinq promenades.",
      selfComparison: "Ce mois-ci, vous avez eu 24 % de jours calmes de plus que le mois dernier.",
      longTerm: [
        "Avant : le fil l’emporte par ennui à l’heure du déjeuner. Désormais, plus précisément : par fatigue tard le soir (c’est ce que montrent les entrées du dernier mois).",
        "Meilleure série : 9 jours dans votre limite.",
      ],
      savedHeadline: "Vous avez récupéré près de 17 heures.",
      equivalents: [
        "environ huit films",
        "deux journées de travail",
        "34 promenades de 30 minutes",
      ],
    },
    challenge: {
      title: "Le téléphone hors de la chambre",
      description:
        "Trois soirs de suite, laissez votre téléphone charger hors de la chambre à partir de 22:30.",
      expectation: "Voyons si les écarts tardifs diminuent.",
    },
  },
};
