import type { Messages } from "./ru";

export const fr: Messages = {
  title: "Confidentialité",
  close: "Fermer",
  links: {
    terms: "Conditions d’utilisation",
    privacy: "Politique de confidentialité",
  },
  sections: {
    stored: {
      title: "Ce qui est stocké",
      text: "Le temps sur le fil, les victoires, les écarts et leurs causes, le journal des envies, les conclusions et la mémoire du coach, les récompenses, les notes, vos alternatives et vos réglages sont stockés uniquement sur votre appareil. Nous ne créons pas de compte. Seul ce dont l’analyse IA a besoin est envoyé au serveur, et uniquement avec votre autorisation (voir ci-dessous).",
    },
    ai: {
      title: "Coach IA et ChatGPT",
      text: "L’analyse IA ne fonctionne qu’après votre autorisation explicite. Les textes de vos entrées (« ce qui s’est passé juste avant l’envie d’ouvrir le fil »), vos réponses aux questions du coach, les statistiques d’habitudes (temps sur le fil, écarts, victoires, leurs heures et jours de la semaine) et la mémoire condensée du coach sont alors envoyés via le serveur StopScroll à OpenAI, où ChatGPT les analyse. Pour affiner ses conclusions avec le temps, le coach peut renvoyer quelques entrées précédentes — six au maximum à la fois, et jamais celles qui ont été supprimées. Si les « Formulations naturelles » sont activées, les phrases du coach déjà prêtes sur l’appareil y sont aussi envoyées. Votre nom, votre e-mail, vos contacts et vos données de compte ne sont pas transmis ; le serveur StopScroll ne conserve rien, et les requêtes à OpenAI sont envoyées sans stockage des réponses (store: false). Selon les règles d’OpenAI, les données reçues via l’API ne servent pas à entraîner les modèles et peuvent être conservées pendant une durée limitée pour prévenir les abus. Vous pouvez désactiver l’envoi dans Réglages → Coach IA.",
      offText:
        "L’analyse IA n’est pas activée dans cette version : les entrées, les conclusions du coach et les statistiques restent uniquement sur votre appareil. Le coach trouve lui-même les tendances, le risque du jour et les conseils, directement sur l’appareil, sans serveur.",
    },
    widgets: {
      title: "Widgets et notifications",
      text: "Les widgets affichent des chiffres que l’app enregistre sur l’appareil. Le rappel du bilan est une notification locale : il est programmé sur le téléphone et ne passe pas par nos serveurs.",
    },
    purchases: {
      title: "Achats",
      text: "L’abonnement est souscrit via l’App Store ou Google Play. Son statut est vérifié par le service RevenueCat à l’aide d’un identifiant anonyme de l’app — sans nom, e-mail ni contenu du journal.",
    },
    ads: {
      title: "Publicité et suivi",
      text: "L’app ne contient ni publicité ni outil d’analyse tiers, et nous ne vous suivons pas dans d’autres apps ni sur des sites web.",
    },
    deletion: {
      title: "Suppression des données",
      text: "Vous pouvez réinitialiser votre progression dans Réglages (cela efface à la fois les entrées et les données du coach IA) ; pour effacer seulement les entrées et la mémoire du coach IA, allez dans Réglages → Coach IA. Supprimer l’app efface tout. Vous pouvez gérer votre abonnement dans les réglages de la boutique.",
    },
  },
};
