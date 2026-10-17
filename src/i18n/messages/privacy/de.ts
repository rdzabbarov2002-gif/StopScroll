import type { Messages } from "./ru";

export const de: Messages = {
  title: "Datenschutz",
  close: "Schließen",
  links: {
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutzerklärung",
  },
  sections: {
    stored: {
      title: "Was gespeichert wird",
      text: "Feed-Zeit, Erfolge, Ausrutscher und deren Gründe, Impuls-Einträge, Erkenntnisse und Gedächtnis des Coachs, Auszeichnungen, Notizen, eigene Alternativen und Einstellungen werden nur auf Ihrem Gerät gespeichert. Wir legen kein Konto an. An den Server geht nur, was für die KI-Analyse nötig ist – und nur mit Ihrer Erlaubnis (siehe unten).",
    },
    ai: {
      title: "KI-Coach und ChatGPT",
      text: "Die KI-Analyse läuft erst, nachdem Sie ausdrücklich zugestimmt haben. Dann werden die Texte Ihrer Einträge („Was ist passiert, bevor Sie den Feed öffnen wollten?“), Ihre Antworten auf Fragen des Coachs, Gewohnheitsstatistiken (Feed-Zeit, Ausrutscher, Erfolge, deren Uhrzeiten und Wochentage) und das komprimierte Gedächtnis des Coachs über den StopScroll-Server an OpenAI gesendet, wo ChatGPT sie auswertet. Um seine Schlüsse mit der Zeit zu präzisieren, kann der Coach einige frühere Einträge erneut senden – höchstens sechs auf einmal und niemals gelöschte. Sind „Natürliche Formulierungen“ aktiviert, gehen auch die fertigen Sätze des Coachs vom Gerät dorthin. Name, E-Mail-Adresse, Kontakte und Kontodaten werden nicht übermittelt; der StopScroll-Server speichert nichts, und Anfragen an OpenAI werden ohne Speicherung der Antworten gesendet (store: false). Laut den Richtlinien von OpenAI werden über die API empfangene Daten nicht zum Training von Modellen verwendet und können zum Schutz vor Missbrauch für begrenzte Zeit aufbewahrt werden. Das Senden können Sie unter Einstellungen → KI-Coach ausschalten.",
      offText:
        "In dieser Version ist die KI-Analyse nicht aktiv: Einträge, Erkenntnisse des Coachs und Statistiken bleiben nur auf Ihrem Gerät. Muster, das Tagesrisiko und Tipps findet der Coach selbst auf dem Gerät, ganz ohne Server.",
    },
    widgets: {
      title: "Widgets und Mitteilungen",
      text: "Widgets zeigen Zahlen, die die App auf dem Gerät speichert. Die Erinnerung an den Bericht ist eine lokale Mitteilung: Sie wird auf dem Handy geplant und läuft nicht über unsere Server.",
    },
    purchases: {
      title: "Käufe",
      text: "Das Abo schließen Sie über den App Store oder Google Play ab. Den Abo-Status prüft der Dienst RevenueCat anhand einer anonymen App-Kennung – ohne Namen, E-Mail-Adresse und Tagebuchinhalte.",
    },
    ads: {
      title: "Werbung und Tracking",
      text: "Die App enthält weder Werbung noch Analyse-Tools von Drittanbietern, und wir verfolgen Sie nicht in anderen Apps oder auf Websites.",
    },
    deletion: {
      title: "Daten löschen",
      text: "Den Fortschritt können Sie in den Einstellungen zurücksetzen (das löscht sowohl die Einträge als auch die Daten des KI-Coachs); nur die Einträge und das Gedächtnis des KI-Coachs löschen Sie unter Einstellungen → KI-Coach. Wenn Sie die App löschen, ist alles weg. Ihr Abo verwalten Sie in den Einstellungen des Stores.",
    },
  },
};
