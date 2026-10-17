import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("fr", count, value);

const ACHIEVEMENTS: PluralForms = { one: "récompense", other: "récompenses" };

export const fr: Messages = {
  title: "Récompenses",
  back: "Retour",
  earned: "Obtenues",
  ofTotal: (total: number) => `sur ${total}`,
  closest: (title: string, progress: string) =>
    `La plus proche\u00A0: «\u00A0${title}\u00A0» — ${progress}.`,
  allEarned: "Vous avez obtenu toutes les récompenses. Le fil ne fait plus la loi.",
  earnedCount: (count: number) => `${count} ${word(count, ACHIEVEMENTS)}`,
  ahead: "À venir",
  earnedOn: (date: string) => `Obtenue le ${date}`,
  howToEarn: "Comment l’obtenir",

  progress: {
    minutes: (current: string, target: string) => `${current} sur ${target}`,
    // "12 fois sur 20", "3 jours sur 7": the unit agrees with the first number.
    count: (current: number, target: number, unit: PluralForms) =>
      `${current} ${word(current, unit)} sur ${target}`,
    once: "À venir",
    onceInline: "à venir",
  },

  units: {
    times: { one: "fois", other: "fois" },
    days: { one: "jour", other: "jours" },
    nights: { one: "nuit", other: "nuits" },
    replacements: { one: "alternative", other: "alternatives" },
    refusals: { one: "refus", other: "refus" },
  },

  unlock: {
    overline: "Nouvelle récompense",
    close: "Génial",
    openAll: "Toutes les récompenses",
  },

  items: {
    "first-choice": {
      title: "Un premier choix pour soi",
      description:
        "L’envie vous tirait vers le fil, et vous avez choisi la pause. Tout commence ici.",
      hint: "Faites une pause ou choisissez une alternative au lieu du fil.",
    },
    "first-evening": {
      title: "Première soirée sans le fil",
      description: "Une soirée où vous avez tenu bon sans jamais céder au fil.",
      hint: "Résistez au fil le soir (17\u00A0h–23\u00A0h) et finissez la soirée sans écart.",
    },
    "first-hour": {
      title: "Première heure gagnée",
      description: "60 minutes restées à vous, pas à l’algorithme.",
      hint: "Gagnez 60 minutes grâce aux pauses et aux alternatives.",
    },
    "morning-free": {
      title: "Le matin vous appartient",
      description: "Un matin qui a commencé par une pause, pas par un défilement sans fin.",
      hint: "Résistez au fil le matin (5\u00A0h–12\u00A0h) et tenez sans écart jusqu’à midi.",
    },
    comeback: {
      title: "Un écart, puis le retour",
      description:
        "Un écart n’a pas été une raison d’abandonner\u00A0: la prochaine envie, vous l’avez surmontée.",
      hint: "Résistez à une envie dans les 24 heures qui suivent un écart enregistré.",
    },
    "honest-look": {
      title: "Cinq bilans honnêtes",
      description:
        "Cinq fois, après un écart, une discussion calme sur ce qui s’est passé plutôt que de l’autocritique.",
      hint: "Répondez au «\u00A0Que s’est-il passé\u00A0?\u00A0» du coach après cinq écarts.",
    },
    "sunday-evening": {
      title: "Le dimanche soir est à vous",
      description:
        "Le soir où l’on scrolle le plus dans la semaine s’est passé sans un seul écart.",
      hint: "Résistez au fil le dimanche soir et finissez-le sans écart.",
    },
    "week-in-limit": {
      title: "Une semaine à votre rythme",
      description: "Sept jours d’affilée dans votre limite. Le fil ne donne plus le tempo.",
      hint: "Restez dans votre limite quotidienne 7 jours d’affilée.",
    },
    "nights-7": {
      title: "7 soirs sans scroll nocturne",
      description: "Sept nuits où le sommeil a compté plus que le fil.",
      hint: "Passez 7 nuits (22\u00A0h–5\u00A0h) sans écart les jours où vous utilisez StopScroll.",
    },
    "stress-10": {
      title: "Le stress sans fuite",
      description: "10 fois, vous avez affronté le stress sans le fil. C’est ça, la résilience.",
      hint: "Résistez 10 fois quand le stress vous pousse vers le fil.",
    },
    "boredom-20": {
      title: "20 victoires sur l’ennui",
      description:
        "L’ennui a tenté de vous attirer vers le fil vingt fois — et a perdu vingt fois.",
      hint: "Résistez 20 fois quand l’ennui vous pousse vers le fil.",
    },
    "replacements-25": {
      title: "Le corps et la tête plutôt que le fil",
      description:
        "25 fois, vous avez choisi le mouvement, une tâche ou un fait plutôt que le défilement.",
      hint: "Réalisez 25 alternatives utiles.",
    },
    "refusals-30": {
      title: "30 refus réussis d’affilée",
      description: "Trente envies d’affilée — et pas un seul écart entre elles.",
      hint: "Résistez 30 fois d’affilée sans écart.",
    },
    "half-feed": {
      title: "Deux fois moins de fil",
      description: "Une semaine où le fil a pris deux fois moins de temps qu’avant StopScroll.",
      hint: "Notez votre temps 7 jours\u00A0: en moyenne, pas plus de la moitié du niveau de départ.",
    },
    "day-of-life": {
      title: "Une journée de vie, à vous",
      description: "1\u202F440 minutes gagnées. Une journée entière que vous avez reprise.",
      hint: "Gagnez 24 heures grâce aux pauses et aux alternatives.",
    },
  },

  firstEveningWith: (app: string) => `Première soirée sans ${app}`,
};
