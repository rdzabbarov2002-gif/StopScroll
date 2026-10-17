import type { Messages } from "./ru";

export const de: Messages = {
  triggers: {
    boredom: {
      label: "Langeweile",
      hint: "Lust auf Neues",
      ask: "Mir war langweilig",
      noun: "Langeweile",
      because: "aus Langeweile",
      reason: "aus Langeweile",
      advice:
        "Langeweile ist Hunger nach Neuem, und der Feed stillt ihn mit leeren Kalorien. Halten Sie etwas „echtes“ Neues bereit: ein Buch, ein Rätsel, einen neuen Weg.",
    },
    fatigue: {
      label: "Müdigkeit",
      hint: "Keine Kraft mehr",
      ask: "Ich hatte keine Kraft",
      noun: "Müdigkeit",
      because: "aus Müdigkeit",
      reason: "aus Müdigkeit",
      advice:
        "Ein müdes Gehirn wählt das Bequemste. Der Feed erholt nicht — er erschöpft noch mehr. Versuchen Sie 3 Minuten mit geschlossenen Augen oder ein Glas Wasser am Fenster.",
    },
    stress: {
      label: "Stress",
      hint: "Einfach weg hier",
      ask: "Ich war unruhig",
      noun: "Stress",
      because: "wegen Stress",
      reason: "wegen Stress",
      advice:
        "Der Feed verspricht Flucht, doch danach kehrt die Unruhe stärker zurück. Erst der Körper: langes Ausatmen, Bewegung, kaltes Wasser — dann Entscheidungen.",
    },
    loneliness: {
      label: "Einsamkeit",
      hint: "Mir fehlen Menschen",
      ask: "Ich fühlte mich einsam",
      noun: "Einsamkeit",
      because: "aus Einsamkeit",
      reason: "aus Einsamkeit",
      advice:
        "Fremde Leben im Feed ersetzen keinen echten Kontakt. Eine kurze Nachricht an einen echten Menschen gibt mehr als eine Stunde Videos.",
    },
    procrastination: {
      label: "Aufschieben",
      hint: "Ich schiebe etwas auf",
      ask: "Ich wollte nicht anfangen",
      noun: "Aufschieben",
      because: "beim Aufschieben",
      reason: "beim Aufschieben von Aufgaben",
      advice:
        "Der Feed ist der bequemste Weg, nicht anzufangen. Schrumpfen Sie die Aufgabe auf einen 2-Minuten-Schritt und erledigen Sie nur diesen.",
    },
    autopilot: {
      label: "Autopilot",
      hint: "Die Hand war schneller",
      ask: "Ging von selbst auf, automatisch",
      noun: "Autopilot",
      because: "auf Autopilot",
      reason: "auf Autopilot",
      advice:
        "Die Gewohnheit ist schneller als der Gedanke. Nehmen Sie die Apps vom Home-Bildschirm und legen Sie das Handy mit dem Display nach unten — Reibung stoppt den Autopiloten.",
    },
    relax: {
      label: "Entspannung",
      hint: "Will abschalten",
      ask: "Ich wollte abschalten",
      noun: "Wunsch nach Entspannung",
      because: "aus dem Wunsch nach Entspannung",
      reason: "zum Abschalten",
      advice:
        "Der Feed verspricht Erholung, liefert sie aber selten. Wählen Sie eine Pause, nach der es Ihnen wirklich besser geht: Dusche, Musik mit geschlossenen Augen, fünf Minuten Dehnen.",
    },
    sleepless: {
      label: "Schlaflosigkeit",
      hint: "Kann nicht einschlafen",
      ask: "Ich konnte nicht einschlafen",
      noun: "Schlaflosigkeit",
      because: "wegen Schlaflosigkeit",
      reason: "bei Schlaflosigkeit",
      advice:
        "Ein heller Bildschirm macht das Gehirn noch wacher. Wenn Sie nicht schlafen können, dimmen Sie das Licht, lesen Sie zehn Minuten in einem gedruckten Buch und laden Sie das Handy außerhalb des Schlafzimmers.",
    },
    other: {
      label: "Anderes",
      hint: "Eigener Grund",
      ask: "Etwas anderes",
      noun: "andere Gründe",
      because: "aus anderen Gründen",
      reason: "aus verschiedenen Gründen",
      advice:
        "Ein paar Worte dazu, was kurz davor war, helfen zu erkennen, was sich wiederholt. Schreiben Sie sie auf — mit der Zeit wird es klarer.",
    },
  },

  feedApps: {
    other: "Andere",
  },

  categories: {
    body: { label: "Körper", description: "Bewegung in 1–3 Minuten" },
    mind: { label: "Kopf", description: "Aufgaben, die den Kopf einschalten" },
    facts: { label: "Fakten", description: "Kurz und lehrreich" },
  },

  items: {
    squats: {
      title: "15 Kniebeugen",
      description: "Schnell mehr Blut im Kopf und ehrliches Dopamin durch etwas Geschafftes.",
      steps: [
        "Stehen Sie auf, die Füße schulterbreit.",
        "Machen Sie 15 langsame Kniebeugen mit geradem Rücken.",
        "Atmen Sie zum Schluss tief ein und spüren Sie, wie Ihnen wärmer wird.",
      ],
    },
    "neck-shoulders": {
      title: "Nacken und Schultern lockern",
      description: "Löst die Verspannung, die der Blick aufs Handy hinterlässt.",
      steps: [
        "Neigen Sie den Kopf langsam zur rechten Schulter, dann zur linken — je 3-mal.",
        "Kreisen Sie die Schultern 10-mal nach hinten.",
        "Verschränken Sie die Hände hinter dem Rücken und öffnen Sie die Brust für 3 Atemzüge.",
      ],
    },
    "eyes-20-20": {
      title: "Augenpause 20-20-20",
      description: "Der Bildschirm hält den Blick auf 30 cm. Gönnen Sie den Augen Weite.",
      steps: [
        "Gehen Sie ans Fenster oder suchen Sie den entferntesten Punkt im Raum.",
        "Schauen Sie 20 Sekunden lang hin und blinzeln Sie dabei ganz natürlich.",
        "Bedecken Sie die Augen 20 Sekunden mit den Handflächen und blinzeln Sie dann langsam 10-mal.",
      ],
    },
    "cold-water": {
      title: "Kaltes Wasser",
      description: "Gesicht waschen und ein Glas Wasser — ein schneller Reset fürs Nervensystem.",
      steps: [
        "Waschen Sie das Gesicht kalt oder halten Sie die Handgelenke 30 Sekunden unter den Wasserstrahl.",
        "Trinken Sie langsam ein Glas Wasser.",
        "Achten Sie darauf, was sich im Körper verändert hat.",
      ],
    },
    "walk-3": {
      title: "Drei Minuten gehen",
      description: "Bewegung ohne Ziel — der beste Neustart für die Aufmerksamkeit.",
      steps: [
        "Lassen Sie das Handy auf dem Tisch.",
        "Gehen Sie drei Minuten durch die Wohnung, das Büro oder das Treppenhaus.",
        "Entdecken Sie unterwegs drei neue Details.",
      ],
    },
    "tidy-surface": {
      title: "Eine Fläche aufräumen",
      description: "Eine kleine erledigte Aufgabe gibt das Gefühl von Kontrolle.",
      steps: [
        "Wählen Sie eine Fläche: Tisch, Regal, Fensterbank.",
        "Räumen Sie in 3 Minuten alles Überflüssige davon weg.",
        "Schauen Sie sich das Ergebnis an — das ist Ihr Sieg.",
      ],
    },
    plank: {
      title: "45 Sekunden Plank",
      description: "Eine kurze Anstrengung, die von der Unruhe auf den Körper umschaltet.",
      steps: [
        "Gehen Sie in den Unterarmstütz, der Körper bildet eine gerade Linie.",
        "Halten Sie 45 Sekunden und atmen Sie gleichmäßig.",
        "Ruhen Sie sich 15 Sekunden im Liegen aus und entspannen Sie den ganzen Körper.",
      ],
    },
    "shake-off": {
      title: "Anspannung abschütteln",
      description: "So bauen Tiere nach einer Gefahr Stress ab.",
      steps: [
        "Stehen Sie auf und schütteln Sie 20 Sekunden die Hände aus.",
        "Nehmen Sie die Schultern dazu, dann die Beine — noch 30 Sekunden.",
        "Halten Sie inne und atmen Sie dreimal langsam aus.",
      ],
    },
    "muscle-relax": {
      title: "Muskelentspannung",
      description: "Anspannen und Loslassen im Wechsel — tiefe Erholung in 3 Minuten.",
      steps: [
        "Ballen Sie 5 Sekunden die Fäuste und lassen Sie dann schlagartig los.",
        "Wiederholen Sie das für Schultern, Gesicht, Bauch und Beine.",
        "Liegen oder sitzen Sie zum Schluss 30 Sekunden ruhig und spüren Sie die Schwere des Körpers.",
      ],
    },
    "serial-sevens": {
      title: "Von 100 in 7ern zurück",
      description: "Fordert den präfrontalen Kortex und unterbricht den automatischen Impuls.",
      steps: [
        "Ziehen Sie im Kopf immer wieder 7 ab, beginnend bei 100: 93, 86, 79…",
        "Verrechnet? Machen Sie bei der letzten richtigen Zahl weiter.",
        "Rechnen Sie weiter, bis Sie unter 10 sind.",
      ],
    },
    "two-minute-step": {
      title: "Ein 2-Minuten-Schritt",
      description: "Statt Feed: der kleinste Schritt einer aufgeschobenen Aufgabe.",
      steps: [
        "Denken Sie an eine Aufgabe, die Sie vor sich herschieben.",
        "Finden Sie darin einen Schritt für 2 Minuten: die Datei öffnen, die erste Zeile schreiben.",
        "Erledigen Sie nur diesen. Weitermachen müssen Sie nicht.",
      ],
    },
    gratitude: {
      title: "Drei gute Dinge",
      description: "Lenkt den Blick vom Mangel auf das, was schon da ist.",
      steps: [
        "Erinnern Sie sich an drei gute Momente von heute — auch an kleine.",
        "Fragen Sie sich bei jedem: Warum ist das passiert?",
        "Schreiben Sie einen Satz auf, wenn Papier zur Hand ist.",
      ],
    },
    "message-human": {
      title: "Einem Menschen schreiben",
      description: "Echter Kontakt statt endloser fremder Leben.",
      steps: [
        "Wählen Sie jemanden, mit dem Sie lange nicht gesprochen haben.",
        "Schicken Sie eine herzliche Nachricht oder eine Frage.",
        "Schließen Sie den Messenger, ohne auf die Antwort zu warten.",
      ],
    },
    "brain-dump": {
      title: "Kopf leeren",
      description: "Die Unruhe wird leiser, wenn die Gedanken auf Papier stehen statt im Kopf.",
      steps: [
        "Nehmen Sie ein Blatt oder Ihre Notizen.",
        "Schreiben Sie 2 Minuten ohne Pause alles auf, was Ihnen durch den Kopf geht.",
        "Unterstreichen Sie eine Sache, die Sie heute erledigen können.",
      ],
    },
    "alphabet-game": {
      title: "Alphabet-Spiel",
      description: "Eine leichte Denkaufgabe, die den Hunger nach Neuem stillt.",
      steps: [
        "Wählen Sie ein Thema: Städte, Tiere, Gerichte.",
        "Nennen Sie zu jedem Buchstaben des Alphabets ein Wort.",
        "Hängen geblieben? Überspringen Sie den Buchstaben und kommen Sie am Ende darauf zurück.",
      ],
    },
    "evening-plan": {
      title: "Den Abend ausmalen",
      description: "Das Gehirn lässt den Feed leichter los, wenn es einen besseren Plan sieht.",
      steps: [
        "Schließen Sie die Augen.",
        "Stellen Sie sich genau vor, wie Sie die nächste Stunde ohne Feed verbringen.",
        "Wählen Sie den ersten Schritt und öffnen Sie die Augen.",
      ],
    },
    "facts-brain": {
      title: "Gehirn und Gewohnheiten",
      description: "Wie der Sog des Feeds funktioniert — und warum er sich umlernen lässt.",
      steps: [
        "Dopamin hängt stärker mit der Erwartung einer Belohnung zusammen als mit dem Genuss selbst. Deshalb fesselt ein endloser Feed mehr als jedes einzelne Video.",
        "Kurzvideos funktionieren wie ein Spielautomat: Die Belohnung kommt unvorhersehbar, und das Gehirn zieht immer weiter „am Hebel“.",
        "Ein Impuls ist wie eine Welle: Er baut sich auf und ebbt wieder ab. Schon eine kurze Pause unterbricht die automatische Handlung und gibt die Chance, anders zu wählen.",
        "Die emotionalen Systeme des Gehirns reagieren schneller als der präfrontale Kortex — der „Chef“, der für Selbstkontrolle zuständig ist. Eine Pause gibt ihm Zeit, den Impuls einzuholen.",
        "Eine neue Gewohnheit festigt sich durch Wiederholung im immer gleichen Kontext. Dieselbe Alternative in derselben Situation wirkt besser als Abwechslung.",
      ],
    },
    "facts-nature": {
      title: "Erstaunliche Natur",
      description: "Ein wenig lebendiges Neues statt Feed.",
      steps: [
        "Ein Oktopus „schmeckt“ die Welt mit seinen Saugnäpfen: Rezeptoren an den Armen unterscheiden Geschmäcker.",
        "Bäume im Wald können über Pilznetzwerke, die ihre Wurzeln umspinnen, Stoffe austauschen.",
        "Das Herz eines Kolibris kann mehr als 1000-mal pro Minute schlagen.",
        "Seeotter halten sich im Schlaf an den Pfoten, damit die Strömung sie nicht auseinandertreibt.",
        "Bienen zeigen einander mit dem „Schwänzeltanz“, in welcher Richtung die Blüten liegen.",
      ],
    },
    "facts-space": {
      title: "Das All in einer Minute",
      description: "Ein Maßstab, neben dem der Feed klein wirkt.",
      steps: [
        "Sonnenlicht braucht etwa 8 Minuten bis zur Erde — wir sehen die Sonne immer ein wenig in der Vergangenheit.",
        "Auf der Venus ist ein Tag länger als ein Jahr: Sie dreht sich langsamer um sich selbst, als sie die Sonne umrundet.",
        "Im beobachtbaren Universum gibt es mehr Sterne als Sandkörner an allen Stränden der Erde.",
        "Die Fußspuren der Astronauten auf dem Mond können Millionen Jahre überdauern — dort weht kein Wind.",
        "Ein Neutronenstern ist so dicht, dass ein Teelöffel seiner Materie Milliarden Tonnen wiegen würde.",
      ],
    },
    "facts-history": {
      title: "Geschichte im Detail",
      description: "Kurze Geschichten, die man gern weitererzählt.",
      steps: [
        "Kleopatra lebte zeitlich näher an der Mondlandung als am Bau der Cheops-Pyramide.",
        "Die Universität Oxford ist älter als das Aztekenreich.",
        "Der kürzeste Krieg der Geschichte — der Britisch-Sansibarische Krieg von 1896 — dauerte weniger als eine Stunde.",
        "Im alten Rom gab es schon „Fast Food“: Straßenküchen, die Thermopolien, mit warmem Essen.",
        "Das Wort „Roboter“ stammt aus einem Theaterstück von Karel Čapek von 1920 — erfunden hat es aber sein Bruder Josef.",
      ],
    },
  },

  breath: {
    inhale: "Einatmen",
    exhale: "Ausatmen",
    hold: "Halten",
    rest: "Pause",
  },

  exercises: {
    "breath-ground": {
      title: "Atmen und erden",
      subtitle: "Langes Ausatmen + 3-2-1-Technik",
      prompts: [
        "Nennen Sie im Stillen 3 Dinge, die Sie gerade sehen",
        "Spüren Sie 2 Stützpunkte: die Füße am Boden und den Rücken",
        "Atmen Sie 1-mal lang aus und lassen Sie die Schultern sinken",
      ],
    },
    "box-breath": {
      title: "Box-Atmung",
      subtitle: "Ruhiger Rhythmus bei starkem Stress",
      prompts: [
        "Durch die Nase einatmen — bis vier zählen",
        "Den Atem anhalten, ohne sich anzustrengen",
        "Langsam durch den Mund ausatmen",
        "Pause. Spüren Sie die Stille in sich",
      ],
    },
    "serial-sevens": {
      title: "Von 100 in 7ern zurück",
      subtitle: "Weckt den „Chef“ im Gehirn",
      prompts: [
        "Rechnen Sie im Kopf: 100 − 7 = ?",
        "Richtig, 93. Weiter: 93 − 7 = ?",
        "Das ist 86. Und noch einmal: 86 − 7 = ?",
      ],
    },
    "intent-check": {
      title: "Drei ehrliche Fragen",
      subtitle: "Achtsamkeit statt Autopilot",
      prompts: [
        "Was fühle ich gerade — in einem Wort?",
        "Was will ich eigentlich vom Feed?",
        "Was gibt mir dieses Gefühl ohne Handy?",
      ],
    },
  },

  equivalents: {
    books: {
      unit: { one: "Buch", other: "Bücher" },
      caption: "ein durchschnittliches Buch ≈ 5 Stunden Lesezeit",
    },
    sleep: {
      unit: { one: "Stunde Schlaf", other: "Stunden Schlaf" },
      caption: "Zeit, die Sie dem Schlaf zurückgeben können",
    },
    walks: {
      unit: { one: "Spaziergang", other: "Spaziergänge" },
      caption: "je 30 Minuten an der frischen Luft",
    },
    workouts: {
      unit: { one: "Workout", other: "Workouts" },
      caption: "je 45 Minuten",
    },
    language: {
      unit: { one: "Sprachlektion", other: "Sprachlektionen" },
      caption: "je 20 Minuten",
    },
    calls: {
      unit: { one: "Gespräch", other: "Gespräche" },
      caption: "mit Ihren Liebsten, je 15 Minuten",
    },
  },

  timeOfDay: {
    morning: { label: "Morgen", phrase: "morgens" },
    afternoon: { label: "Nachmittag", phrase: "nachmittags" },
    evening: { label: "Abend", phrase: "abends" },
    night: { label: "Nacht", phrase: "nachts" },
  },
};
