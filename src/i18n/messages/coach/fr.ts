import { selectPlural, type PluralForms } from "../../plural";
import type { Cause, Messages } from "./ru";

/** "3 écarts" — a number with its word, never broken across lines. */
const count = (value: number, forms: PluralForms) =>
  `${value}\u00A0${selectPlural("fr", value, forms)}`;

const SLIPS: PluralForms = { one: "écart", other: "écarts" };
const DAYS: PluralForms = { one: "jour", other: "jours" };
const TIMES: PluralForms = { one: "fois", other: "fois" };
const WALKS: PluralForms = { one: "balade", other: "balades" };
const ALTERNATIVES: PluralForms = { one: "alternative", other: "alternatives" };

const WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
/** "vendredi" — "le vendredi" for a habit, "vendredi" for a day of this week. */
const day = (index: number) => WEEKDAYS[index] ?? "";
/** "vendredis" — "3 des 4 derniers vendredis" */
const days = (index: number) => `${day(index)}s`;

/** Feminine, for "semaine" and "fois": "la troisième fois". */
const ORDINALS = [
  "",
  "première",
  "deuxième",
  "troisième",
  "quatrième",
  "cinquième",
  "sixième",
  "septième",
  "huitième",
  "neuvième",
  "dixième",
];
const ordinal = (value: number) => ORDINALS[value] ?? `${value}e`;

export const fr: Messages = {
  greeting: {
    morning: "Bonjour",
    afternoon: "Bonjour",
    evening: "Bonsoir",
    night: "Bonsoir",
  },

  tidy: (text: string) =>
    text.replace(/(\d) sur (\d)/g, "$1\u00A0sur\u00A0$2").replace(/(\d) —/g, "$1\u00A0—"),

  guard: {
    forbidden:
      /(^|[^A-Za-zÀ-ÿœŒ])IA(?![A-Za-zÀ-ÿœŒ])|intelligence artificielle|réseaux? de neurones|modèles? de langage/i,
    weekdays: [/lundi/i, /mardi/i, /mercredi/i, /jeudi/i, /vendredi/i, /samedi/i, /dimanche/i],
  },

  briefing: {
    risk: {
      hardWeekday: (index: number, bad: number, active: number) =>
        `Le ${day(index)}, tu as le plus souvent des journées difficiles\u00A0: ${bad} des ${active} derniers ${days(index)}.`,
      calmWeekday: (index: number, bad: number, active: number) =>
        bad === 0
          ? `Le ${day(index)}, les écarts sont plutôt rares\u00A0: aucun des ${active} derniers ${days(index)} n’a été difficile.`
          : bad === 1
            ? `Le ${day(index)}, les écarts sont plutôt rares\u00A0: un seul des ${active} derniers ${days(index)} a été difficile.`
            : `Le ${day(index)}, les écarts sont plutôt rares\u00A0: seulement ${bad} des ${active} derniers ${days(index)} ont été difficiles.`,
      recentSlips: (slips: number) =>
        `${count(slips, SLIPS)} ces trois derniers jours — les envies sont plus fortes que d’habitude en ce moment.`,
      oneRecentSlip: "Un écart ces trois derniers jours.",
      yesterdayOver: (scroll: string, limit: string) =>
        `Hier, le fil t’a pris ${scroll} — plus que ta limite de ${limit}.`,
      todayOver: (scroll: string, limit: string) =>
        `Ta limite du jour est déjà dépassée\u00A0: ${scroll} sur ${limit}.`,
      todaySlip: "Il y a déjà eu un écart aujourd’hui.",
      streak: (value: number) =>
        `Ça fait ${count(value, DAYS)} d’affilée que tu restes dans ta limite.`,
      heavierWeek: (recent: string, previous: string) =>
        `La semaine passée a été plus lourde que la précédente\u00A0: ${recent} de fil par jour en moyenne, contre ${previous}.`,
      lighterWeek: (recent: string, previous: string) =>
        `La semaine passée a été plus légère que la précédente\u00A0: ${recent} de fil par jour en moyenne, contre ${previous}.`,
      calmWeek: "Aucun écart la semaine passée.",
      noSignals: (slips: number) =>
        `Pas de signal de risque net aujourd’hui\u00A0: ${count(slips, SLIPS)} cette semaine, jamais d’affilée.`,
    },
    memory: {
      workedEvening: "Le conseil d’hier a marché\u00A0: la soirée s’est passée sans écart.",
      workedDay: "Le conseil d’hier a marché\u00A0: une journée sans écart et dans la limite.",
      missed: [
        "Hier, ça n’a pas marché — ce n’est pas grave. Aujourd’hui, on essaie autrement.",
        "Le conseil d’hier n’a pas marché, et c’est bon à savoir aussi. Aujourd’hui, une autre approche.",
      ],
    },
  },

  insights: {
    timeAfter: [
      (slips: number, total: number, time: string) =>
        `Ces quatre dernières semaines, ${slips} écarts sur ${total} sont arrivés après ${time}.`,
      (slips: number, total: number, time: string) =>
        `La plupart des écarts — ${slips} sur ${total} ces quatre dernières semaines — commencent après ${time}.`,
    ],
    timeWindow: (from: string, to: string, slips: number, total: number) =>
      `Les écarts arrivent le plus souvent entre ${from} et ${to}\u00A0: ${slips} sur ${total} ces quatre dernières semaines.`,
    topReason: [
      (cause: Cause, slips: number, total: number) =>
        `Principale raison de tes derniers écarts\u00A0: ${cause.noun} (${slips} sur ${total}).`,
      (cause: Cause, slips: number, total: number) =>
        `Ces trois dernières semaines, tes écarts sont surtout survenus ${cause.because}\u00A0: ${slips} sur ${total}.`,
    ],
    recurringWeekday: (weeks: number, index: number) =>
      `C’est déjà la ${ordinal(weeks)} semaine d’affilée où le ${day(index)} reste ton jour le plus difficile.`,
    hardWeekday: (index: number, bad: number, active: number) =>
      `Le ${day(index)} est ton jour le plus difficile\u00A0: ${bad} des ${active} derniers ${days(index)} ont connu un écart ou un dépassement de limite.`,
    calmWeekdayNone: (index: number, active: number) =>
      `Le ${day(index)}, le risque d’écart est minimal\u00A0: aucun des ${active} derniers ${days(index)} n’a été difficile.`,
    calmWeekday: (index: number, bad: number, active: number) =>
      bad === 1
        ? `Le ${day(index)}, les écarts sont les plus rares\u00A0: un seul des ${active} derniers ${days(index)} a été difficile.`
        : `Le ${day(index)}, les écarts sont les plus rares\u00A0: seulement ${bad} des ${active} derniers ${days(index)} ont été difficiles.`,
    walksNoSlips: (walks: number) =>
      `Ces quatre dernières semaines, tu as fait ${count(walks, WALKS)} — et aucune n’a été suivie d’un écart dans les trois heures.`,
    walksFewSlips: (slipsAfter: number, walks: number) =>
      `Après une balade, les écarts sont rares\u00A0: seulement ${count(slipsAfter, WALKS)} sur ${walks} ${slipsAfter < 2 ? "s’est terminée" : "se sont terminées"} sur le fil dans les trois heures.`,
    replacementsNoSlips: (withoutRate: number) =>
      `Les jours où tu fais au moins une alternative, il n’y a eu aucun écart, alors que sans alternative, ${withoutRate}\u00A0% des jours ont été difficiles.`,
    replacementsFewer: (withRate: number, withoutRate: number) =>
      `Les jours avec alternatives sont nettement plus faciles\u00A0: ${withRate}\u00A0% de journées difficiles, contre ${withoutRate}\u00A0% les autres jours.`,
    scrollDownSteady: (average: string, change: number) =>
      `Deux semaines de progrès réguliers\u00A0: le fil te prend en moyenne ${average} par jour, ${change}\u00A0% de moins qu’avant, sans plus d’écarts.`,
    scrollDown: (average: string, change: number) =>
      `Ces deux dernières semaines, le fil te prend en moyenne ${average} par jour — ${change}\u00A0% de moins que les deux semaines d’avant.`,
    scrollUp: (recent: string, previous: string) =>
      `Le fil a pris plus de place ces deux dernières semaines\u00A0: ${recent} par jour en moyenne, contre ${previous} avant.`,
    slipsDown: (recent: number, previous: number) =>
      `Nettement moins d’écarts\u00A0: ${recent} ces deux dernières semaines, contre ${previous} avant.`,
    slipsUp: (recent: number, previous: number) =>
      `Plus d’écarts ces deux dernières semaines\u00A0: ${recent} contre ${previous} avant.`,
    eveningBetter: (time: string, recent: number, previous: number) =>
      `Tes soirées vont mieux qu’il y a un mois\u00A0: ${count(recent, SLIPS)} après ${time} ce mois-ci, contre ${previous} le mois d’avant.`,
    shorterSlips: (recent: string, previous: string) =>
      `Les écarts sont plus courts\u00A0: ${recent} en moyenne, contre ${previous} deux semaines plus tôt.`,
    streakGap: (best: number, gap: number) =>
      `Plus que ${count(gap, DAYS)} avant ton record — ${count(best, DAYS)} d’affilée.`,
    streakRecord: (value: number) =>
      `Tu vis ta plus longue série\u00A0: ${count(value, DAYS)} d’affilée dans la limite.`,
  },

  advice: {
    earlySleep: [
      "Aujourd’hui, essaie de te coucher une demi-heure plus tôt et de laisser ton téléphone charger hors de la chambre.",
      "Mieux vaut te coucher tôt aujourd’hui\u00A0: pour un cerveau fatigué, le fil semble toujours une bonne idée — le lendemain matin, beaucoup moins.",
    ],
    phoneAway: [
      (time: string) =>
        `Aujourd’hui, après le dîner, pose ton téléphone dans une autre pièce pendant au moins 15 minutes — surtout vers ${time}.`,
      (time: string) =>
        `Vers ${time}, pose ton téléphone écran vers le bas dans une autre pièce et laisse la soirée passer sans le fil.`,
    ],
    walkHelps: [
      "Après une balade, tu n’as presque jamais d’écart. Aujourd’hui, quand le fil t’attire, commence par cinq minutes dehors.",
      "Les balades t’aident — tes données le montrent. Quand le fil t’attire aujourd’hui, sors marcher au moins cinq minutes.",
    ],
    walkTry: (app: string | null) =>
      `Quand ${app ?? "le fil"} t’attire aujourd’hui, essaie plutôt une courte balade.`,
    livingAlternative: [
      "Garde en vue une alternative «\u00A0vivante\u00A0» au fil — un livre, un carnet, une guitare. L’ennui a besoin de nouveauté, pas d’un défilement sans fin.",
      "Prépare à l’avance une activité pour les moments d’ennui\u00A0: une page de livre, une petite énigme, un appel. Le fil aura de la concurrence.",
    ],
    moveApps:
      "Retire les applis de fil de ton écran d’accueil. Le pilote automatique va plus vite que la pensée — ajoute-lui une étape.",
    moveApp: (app: string) =>
      `Retire ${app} de l’écran d’accueil de ton téléphone. Le pilote automatique va plus vite que la pensée — ajoute-lui une étape.`,
    breatheFirst: [
      "Si l’angoisse monte aujourd’hui, commence par une longue expiration ou une pause SOS. Le fil promet une fuite, mais l’angoisse revient ensuite.",
      "Quand la tension monte, accorde-toi 15 secondes de pause SOS avant d’ouvrir le fil. Ton corps se calme plus vite qu’avec des vidéos.",
    ],
    callSomeone:
      "Écris aujourd’hui à une personne qui compte pour toi. Une vraie conversation réchauffe plus que la vie des autres sur le fil.",
    tinyStep:
      "Si tu as envie de remettre une tâche à plus tard aujourd’hui, fais juste un premier pas de deux minutes. Le fil sert surtout à ne pas commencer.",
    realRest:
      "Choisis aujourd’hui une pause qui fait vraiment du bien\u00A0: une douche, de la musique les yeux fermés ou cinq minutes d’étirements.",
    keepRhythmLogged: [
      "Risque faible aujourd’hui — garde simplement ton rythme. Si le fil t’attire, la pause est toujours là.",
      "Journée calme aujourd’hui. Rien à prouver — continue comme ça.",
    ],
    keepRhythm: [
      "Risque faible aujourd’hui — garde simplement ton rythme. Ce soir, note ton temps sur le fil pour que la série continue.",
      "Journée calme aujourd’hui. N’oublie pas de noter ton temps sur le fil ce soir — la série tient à ces notes.",
    ],
    logLearning:
      "Note chaque jour le temps passé sur le fil, ainsi que tes écarts. Dans quelques jours, je pourrai te parler concrètement de tes habitudes.",
    logToday: "Note aujourd’hui le temps passé sur le fil — ça m’aidera à repérer des tendances.",
    sosReady: [
      "Garde la pause SOS sous la main\u00A0: 15 secondes de respiration, et la décision te revient.",
      "Si l’envie est forte, appuie sur la pause SOS. Elle n’interdit rien — elle te laisse juste le temps de réfléchir.",
    ],
    forWeek: (tip: string) =>
      tip.replace(/Aujourd’hui/g, "Cette semaine").replace(/aujourd’hui/g, "cette semaine"),
  },

  replacement: {
    helped: (times: number) => `Déjà ${count(times, TIMES)} sans écart après elle.`,
    matches: (cause: Cause) =>
      `Idéale quand la raison est ${cause.noun}\u00A0: c’est ton cas le plus fréquent.`,
    lastTime: "La dernière fois, aucun écart n’a suivi.",
  },

  reflection: {
    understanding: {
      boredom:
        "L’ennui est l’une des raisons les plus courantes qui font tendre la main vers le fil.",
      fatigue:
        "Quand l’énergie manque, le cerveau choisit le plus facile — et le fil est toujours à portée de main.",
      relax:
        "Avoir envie de se reposer, c’est normal. Le fil offre juste rarement le repos qu’on vient y chercher.",
      sleepless:
        "Quand le sommeil ne vient pas, l’écran semble une solution, mais il repousse surtout le sommeil.",
      autopilot:
        "Le pilote automatique se déclenche avant la pensée — c’est une habitude, pas une faiblesse.",
      stress: "Quand l’angoisse monte, le fil promet une pause. On comprend que la main s’y tende.",
      loneliness:
        "Quand la solitude pèse, la vie des autres sur le fil donne un instant une impression de compagnie.",
      procrastination:
        "Le fil aide souvent à ne pas commencer une tâche difficile. Ça arrive à tout le monde.",
      other: "Comprendre ce qui s’est passé, c’est déjà un pas utile.",
    },
    nextTime: {
      boredom:
        "La prochaine fois, essaie d’abord une courte alternative — l’ennui a besoin de nouveauté.",
      fatigue: "Aujourd’hui, mieux vaut te coucher plus tôt que tenir à la force de la volonté.",
      relax: "La prochaine fois, essaie de te reposer sans écran — ne serait-ce que cinq minutes.",
      sleepless:
        "Si le sommeil ne vient toujours pas, baisse la lumière et pose ton téléphone loin du lit.",
      autopilot:
        "La friction aide\u00A0: retire l’appli de l’écran d’accueil, et le pilote automatique aura plus de mal.",
      stress:
        "La prochaine fois, commence par une longue expiration ou une pause SOS — le corps se calmera plus vite.",
      loneliness:
        "La prochaine fois, essaie d’écrire à une vraie personne — ça réchauffe plus longtemps.",
      procrastination:
        "La prochaine fois, commence la tâche par une étape de deux minutes — la suite est souvent plus facile.",
      other: "Si tu veux, ajoute quelques mots — ça aide à repérer ce qui se répète.",
    },
    thanksForNote: "Merci de le raconter avec tes mots — je m’en souviendrai.",
    noted: "Je m’en souviendrai.",
    repeated: (times: number, cause: Cause) =>
      `C’est déjà la ${ordinal(times)} fois en deux semaines que la raison est ${cause.noun}.`,
    twice: "Quelque chose de semblable est arrivé il y a peu — je m’en souviendrai.",
    first:
      "Je m’en souviendrai\u00A0: plus tes notes sont honnêtes, plus mes conseils sont précis.",
    lateEvening: (cause: Cause) =>
      `La fin de soirée et ${cause.noun}\u00A0: un mélange où le fil gagne presque toujours.`,
    close: [
      "Un écart n’efface rien.",
      "C’est un épisode, pas le bilan de ta journée.",
      "Demain est un autre jour.",
    ],
  },

  review: {
    titles: {
      good: "Ce qui a marché",
      worse: "Ce qui s’est dégradé",
      habit: "L’habitude qui s’est améliorée",
      weak: "Là où le fil gagne le plus souvent",
      next: "À essayer la semaine prochaine",
    },
    savedMovies: (duration: string, movies: number) =>
      `Cette semaine t’a rendu ${duration} — de quoi voir ${movies === 1 ? "un film entier" : `${movies} films`}.`,
    saved: (duration: string) => `Cette semaine t’a rendu ${duration}.`,
    daysInLimit: (inLimit: number, logged: number) =>
      `${count(inLimit, DAYS)} sur ${logged} dans la limite.`,
    fewerSlips: (now: number, before: number) =>
      `Moins d’écarts\u00A0: ${now} contre ${before} la semaine d’avant.`,
    impulses: (percent: number) => `${percent}\u00A0% des envies sont passées sans le fil.`,
    replacements: (replacements: number) => `${count(replacements, ALTERNATIVES)} au lieu du fil.`,
    noWins: [
      "Peu de victoires nettes cette semaine — mais on voit maintenant sur quoi s’appuyer.",
      "Une semaine difficile. Ce n’est pas un échec, ce sont des données\u00A0: elles montrent déjà où amortir la chute.",
    ],
    firstWeek: "Rien à comparer pour l’instant — c’est la première semaine avec des notes.",
    moreSlips: (now: number, before: number) => `Plus d’écarts\u00A0: ${now} contre ${before}.`,
    moreScroll: (now: string, before: string) =>
      `Le fil a pris en moyenne ${now} par jour, contre ${before} la semaine d’avant.`,
    heldLess: (now: number, before: number) =>
      `Résister a moins souvent marché\u00A0: ${now}\u00A0% contre ${before}\u00A0%.`,
    nothingWorse: "Rien ne s’est vraiment dégradé.",
    habitFirstWeek:
      "Rien à comparer pour l’instant — dans une semaine, l’évolution apparaîtra ici.",
    eveningHabit: (time: string, now: number, before: number) =>
      `Les soirées\u00A0: ${count(now, SLIPS)} après ${time}, contre ${before} la semaine d’avant.`,
    reasonHabit: (cause: Cause, now: number, before: number) =>
      `Moins d’écarts ${cause.because}\u00A0: ${now} contre ${before} la semaine d’avant.`,
    switchHabit: (now: number, before: number) =>
      `L’habitude de passer à autre chose se renforce\u00A0: ${count(now, ALTERNATIVES)} contre ${before} la semaine d’avant.`,
    scrollHabit: (now: string, before: string) =>
      `Le temps sur le fil a baissé\u00A0: ${now} par jour contre ${before}.`,
    noHabit: "Aucune habitude n’a encore vraiment bougé — pour une seule semaine, c’est normal.",
    noWeakSpots: "Aucun point faible en vue\u00A0: pas un seul écart de la semaine.",
    singleSlip: (index: number, time: string, cause: Cause | null) =>
      `Un seul écart — ${day(index)} vers ${time}${cause ? `, ${cause.because}` : ""}.`,
    hardest: (index: number | null, time: string | null, cause: Cause | null) => {
      const where = [index !== null ? day(index) : null, time && `vers ${time}`]
        .filter(Boolean)
        .join(" ");
      const why = cause ? ` — en général ${cause.because}` : "";
      return where
        ? `Le plus dur, c’était ${where}${why}.`
        : `Les moments difficiles sont arrivés à des heures variées${why}.`;
    },
    goal: (tip: string, target: number) =>
      `${tip} Et un petit objectif\u00A0: ${count(target, DAYS)} sur 7 dans la limite.`,
    logDaily: (tip: string) =>
      `${tip} Et essaie de noter ton temps sur le fil chaque jour — le prochain bilan sera plus précis.`,
  },

  ui: {
    badge: "Votre coach personnel",
    briefing: {
      learningCaption: "Je découvre tes habitudes",
      caption: "Le briefing du jour",
      learning: (needed: number) =>
        `Je rassemble encore des informations — la prévision apparaîtra quand il y aura ${count(needed, DAYS)} avec des notes.`,
      progress: (active: number, needed: number) =>
        `Jours avec des notes\u00A0: ${active} sur ${needed}. Tout compte\u00A0: temps sur le fil, pause SOS, alternative ou écart.`,
      riskTitle: "Risque de scroll incontrôlé aujourd’hui",
      riskA11y: (level: string) => `Risque de scroll incontrôlé aujourd’hui\u00A0: ${level}`,
      riskLevels: { low: "Faible", medium: "Moyen", high: "Élevé" },
      why: "Pourquoi\u00A0: ",
      adviceTitle: "Le conseil du jour",
      start: (title: string) => `Commencer\u00A0: ${title}`,
    },
    insightsTitle: "Ce que montrent les notes",
    reflection: {
      title: "Que s’est-il passé\u00A0?",
      subtitle: "Sans jugement — juste pour voir ce qui se répète.",
      replyTitle: "Je comprends",
      placeholder: "Ou en quelques mots — facultatif",
      noteA11y: "Ce qui s’est passé, en quelques mots",
      done: "Terminé",
      notNow: "Pas maintenant",
      tryReplacement: (title: string) => `Essayer\u00A0: ${title}`,
      thanks: "Merci",
    },
    weeklyCaption: "Le bilan de la semaine",
  },
};
