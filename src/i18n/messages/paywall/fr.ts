import { selectPlural, type PluralForms } from "../../plural";
import type { Messages, PeriodUnit } from "./ru";

/** The period with its agreeing adjective: "7 jours gratuits", "1 semaine gratuite". */
const PERIODS: Record<PeriodUnit, PluralForms> = {
  DAY: { one: "jour gratuit", other: "jours gratuits" },
  WEEK: { one: "semaine gratuite", other: "semaines gratuites" },
  MONTH: { one: "mois gratuit", other: "mois gratuits" },
  YEAR: { one: "an gratuit", other: "ans gratuits" },
};

export const fr: Messages = {
  close: "Fermer",
  title: "StopScroll Pro",
  activeTitle: "Pro est activé",
  thanks: "Merci de soutenir l’app !",
  activeText: "Tous les exercices, alternatives et analyses sont débloqués.",
  done: "Terminé",
  plansFailed: "Impossible de charger les offres.",
  retry: "Réessayer",
  tryTrial: (trial: string) => `Essayer ${trial}`,
  subscribe: "Passer à Pro",
  restore: "Restaurer les achats",
  nothingToRestore: "Aucun achat actif trouvé pour ce compte de la boutique.",
  renewal: (plan: string, price: string) =>
    `L’abonnement « ${plan} » à ${price} se renouvelle automatiquement jusqu’à sa résiliation. Vous pouvez le résilier à tout moment dans les réglages de l’App Store ou de Google Play, au plus tard 24 heures avant la fin de la période.`,
  table: {
    free: "Gratuit",
    pro: "Pro",
    yes: "oui",
    no: "non",
    row: (label: string, free: string, pro: string) => `${label} : gratuit — ${free}, Pro — ${pro}`,
  },
  rows: {
    sos: "Pause SOS",
    exercises: "Exercices de pause",
    replacements: "Alternatives",
    replacementsPro: (count: number) => `${count} + les vôtres`,
    trend: "Évolution",
    heatmap: "Carte de chaleur",
    converter: "Convertisseur de temps",
    patterns: "Tendances",
    days: (count: number) => `${count} jours`,
    weeks: (count: number) => `${count} sem.`,
  },
  headlines: {
    default: {
      title: "Reprenez votre temps aux algorithmes",
      text: "Tous les exercices, le catalogue complet d’alternatives, vos propres habitudes et des analyses approfondies.",
    },
    exercises: {
      title: "Tous les exercices de la pause SOS",
      text: "Respiration carrée, compte à rebours depuis 100 et questions honnêtes — des clés différentes pour des envies différentes.",
    },
    replacements: {
      title: "Le catalogue complet de micro-alternatives",
      text: "Plus de mouvement, de défis pour l’esprit et de faits courts — de la dopamine saine pour chaque moment.",
    },
    custom: {
      title: "Vos propres alternatives et habitudes",
      text: "Ajoutez ce qui marche pour vous : guitare, pompes, une page de livre.",
    },
    analytics: {
      title: "Analyse approfondie des tendances",
      text: "Découvrez à quelle heure et quel jour de la semaine le fil l’emporte le plus souvent — et préparez-vous à l’avance.",
    },
    history: {
      title: "Tout l’historique de vos progrès",
      text: "L’évolution sur 30 jours et une carte de chaleur sur 16 semaines — pour voir l’habitude changer.",
    },
    converter: {
      title: "Le convertisseur de temps complet",
      text: "Séances de sport, cours de langue et moments avec vos proches : le temps que vous avez repris au fil.",
    },
  },
  plans: {
    annual: "Annuel",
    sixMonths: "6 mois",
    threeMonths: "3 mois",
    twoMonths: "2 mois",
    monthly: "Mensuel",
    weekly: "Hebdomadaire",
    lifetime: "À vie",
    trial: (count: number, unit: PeriodUnit) =>
      `${count} ${selectPlural("fr", count, PERIODS[unit])}`,
    oneTime: "achat unique",
    pricePerMonth: (price: string) => `≈ ${price} par mois`,
    perMonth: "par mois",
    perWeek: "par semaine",
    savings: (percent: number) => `−${percent} %`,
  },
  unavailable: {
    demoTitle: "Version de démo : paiement désactivé",
    devTitle: "Achats non configurés dans ce build",
    title: "Achats temporairement indisponibles",
    demoText:
      "Dans l’app de l’App Store et de Google Play, les offres s’afficheront ici. Pour découvrir les fonctions Pro, activez le Pro de test.",
    devText:
      "Indiquez les clés RevenueCat dans .env.local (voir .env.example) et relancez le build — les offres apparaîtront ici automatiquement.",
    text: "Impossible de joindre la boutique. Réessayez plus tard — toutes les fonctions gratuites restent disponibles.",
    testProOff: "Désactiver le Pro de test",
    testProOn: "Activer Pro pour tester",
  },
  errors: {
    network: "Pas de connexion avec la boutique. Vérifiez votre connexion Internet et réessayez.",
    alreadyPurchased: "Cet abonnement est déjà actif. Touchez « Restaurer les achats ».",
    notAllowed: "Les achats ne sont pas autorisés sur cet appareil ou avec ce compte.",
    pending:
      "Le paiement est en attente de validation. Pro s’activera automatiquement dès qu’il sera confirmé.",
    planUnavailable: "Cette offre n’est pas disponible dans votre boutique pour le moment.",
    generic: "Impossible de finaliser l’achat. Réessayez un peu plus tard.",
    noPlans: "Les offres ne sont pas encore publiées. Revenez un peu plus tard.",
    notActivated:
      "Le paiement est passé, mais Pro n’est pas encore actif. Essayez « Restaurer les achats ».",
  },
};
