import type { Messages } from "./ru";

export const fr: Messages = {
  back: "Aujourd’hui",
  title: "Réglages",
  pro: {
    title: "StopScroll Pro",
    active: "StopScroll Pro est actif",
    open: "Ouvrir StopScroll Pro",
    activeText: "Tous les exercices, alternatives et analyses approfondies sont débloqués.",
    pitch: "Tous les exercices, vos alternatives et des analyses approfondies",
    restore: "Restaurer les achats",
    restored: "Pro a été restauré.",
    nothingToRestore: "Aucun achat actif trouvé.",
  },
  appearance: "Apparence",
  goals: {
    header: "Objectifs",
    limit: "Limite quotidienne du fil",
    limitHint: "Un jour sous la limite prolonge votre série",
    session: "Une session sur le fil",
    sessionHint: "Minutes comptées pour chaque victoire",
    baseline: "Point de départ",
    baselineHint: "Votre temps quotidien sur le fil avant StopScroll",
  },
  coach: {
    header: "Coach et bilans",
    footer: (time: string) =>
      `Le dimanche à ${time}, le coach analyse votre semaine et vous prévient quand le bilan est prêt.`,
    footerWithPhrasing: (time: string) =>
      `Le dimanche à ${time}, le coach analyse votre semaine et vous envoie une notification. Formulations naturelles : ChatGPT reformule les conclusions du coach (sans vos notes ni vos entrées) — les faits et les chiffres restent les mêmes. Nécessite l’autorisation de l’analyse IA.`,
    report: "Bilan du dimanche",
    reportSwitch: "Me prévenir du bilan hebdomadaire",
    phrasing: "Formulations naturelles",
    phrasingSwitch: "Formulations naturelles des conseils du coach",
    notificationsWeb: "Les notifications fonctionnent dans l’app sur iPhone et Android.",
    notificationsDenied:
      "Autorisez les notifications de StopScroll dans les réglages du téléphone pour recevoir le bilan.",
  },
  ai: {
    header: "Coach IA",
    offFooter:
      "L’analyse IA n’est pas activée dans cette version : vos entrées restent sur le téléphone.",
    offValue: "Non connecté",
    footer:
      "Les entrées, réponses et statistiques d’habitudes ne sont envoyées à OpenAI (ChatGPT) via le serveur StopScroll qu’avec votre autorisation. La mémoire du coach reste sur le téléphone.",
    consent: "Analyse par ChatGPT",
    consentSwitch: "Autoriser ChatGPT à analyser les entrées",
    confirmErase: "Effacer les entrées et la mémoire du coach ?",
    erase: "Supprimer les données du coach IA",
  },
  feed: "Fil principal",
  dev: {
    demo: "Version de démo",
    development: "Développement",
    demoText:
      "Cette version sert à découvrir l’app dans le navigateur : le paiement est désactivé. Remplissez l’app avec des données d’exemple pour voir les graphiques, les séries et les tendances.",
    demoFill: "Remplir avec des données d’exemple",
    testPro: "Pro de test",
    testProDemo: "Débloque les fonctions Pro sans achat pour les découvrir.",
    testProDev: "Uniquement en build de dev : débloque les fonctions Pro sans achat.",
  },
  data: {
    header: "Données",
    text: "Toutes les données sont stockées uniquement sur cet appareil. La réinitialisation efface l’historique du temps, des victoires et des écarts, vos alternatives, le journal des envies et la mémoire du coach IA, mais conserve vos objectifs et votre abonnement.",
    reset: "Réinitialiser la progression",
  },
  cancel: "Annuler",
  erase: "Effacer",
};
