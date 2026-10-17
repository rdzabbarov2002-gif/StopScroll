import { selectPlural, type PluralForms } from "../../plural";
import type { Cause, Messages } from "./ru";

/** "3 Ausrutscher" — a number with its word, never broken across lines. */
const count = (value: number, forms: PluralForms) =>
  `${value}\u00A0${selectPlural("de", value, forms)}`;

const SLIPS: PluralForms = { one: "Ausrutscher", other: "Ausrutscher" };
const DAYS: PluralForms = { one: "Tag", other: "Tage" };
const TIMES: PluralForms = { one: "Mal", other: "Mal" };
const WALKS: PluralForms = { one: "Spaziergang", other: "Spaziergänge" };
const ALTERNATIVES: PluralForms = { one: "Alternative", other: "Alternativen" };

const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
/** "Freitag" */
const day = (index: number) => WEEKDAYS[index] ?? "";
/** "Freitage" — "3 der letzten 4 Freitage" */
const days = (index: number) => `${day(index)}e`;
/** "Freitags" — at the start of a sentence. */
const onDays = (index: number) => `${day(index)}s`;

/** Weak forms after "die"/"das": "die dritte Woche", "das dritte Mal". */
const ORDINALS = [
  "",
  "erste",
  "zweite",
  "dritte",
  "vierte",
  "fünfte",
  "sechste",
  "siebte",
  "achte",
  "neunte",
  "zehnte",
];
const ordinal = (value: number) => ORDINALS[value] ?? `${value}.`;

/** Durations end with an abbreviation ("20 Min."): no second full stop after them. */
const end = (sentence: string) => sentence.replace(/\.\.$/, ".");

export const de: Messages = {
  greeting: {
    morning: "Guten Morgen",
    afternoon: "Guten Tag",
    evening: "Guten Abend",
    night: "Guten Abend",
  },

  tidy: (text: string) =>
    text.replace(/(\d) von (\d)/g, "$1\u00A0von\u00A0$2").replace(/(\d) —/g, "$1\u00A0—"),

  guard: {
    forbidden:
      /(^|[^A-Za-zÄÖÜäöüß])KI(?![A-Za-zÄÖÜäöüß])|künstliche[nrs]? Intelligenz|neuronale[nrs]? Netz|Sprachmodell/i,
    weekdays: [
      /montag/i,
      /dienstag/i,
      /mittwoch/i,
      /donnerstag/i,
      /freitag/i,
      /samstag|sonnabend/i,
      /sonntag/i,
    ],
  },

  briefing: {
    risk: {
      hardWeekday: (index: number, bad: number, active: number) =>
        `${onDays(index)} hast du am häufigsten schwierige Tage: ${bad} der letzten ${active} ${days(index)}.`,
      calmWeekday: (index: number, bad: number, active: number) =>
        bad === 0
          ? `${onDays(index)} passieren Ausrutscher meist selten: Keiner der letzten ${active} ${days(index)} war schwierig.`
          : `${onDays(index)} passieren Ausrutscher meist selten: Nur ${bad} der letzten ${active} ${days(index)} ${bad === 1 ? "war" : "waren"} schwierig.`,
      recentSlips: (slips: number) =>
        `In den letzten drei Tagen gab es ${count(slips, SLIPS)} — die Impulse sind gerade stärker als sonst.`,
      oneRecentSlip: "In den letzten drei Tagen gab es einen Ausrutscher.",
      yesterdayOver: (scroll: string, limit: string) =>
        end(`Gestern warst du ${scroll} im Feed — mehr als dein Limit von ${limit}.`),
      todayOver: (scroll: string, limit: string) =>
        end(`Dein Limit ist heute schon überschritten: ${scroll} von ${limit}.`),
      todaySlip: "Heute gab es schon einen Ausrutscher.",
      streak: (value: number) =>
        `Schon ${count(value, DAYS)} in Folge bleibst du innerhalb deines Limits.`,
      heavierWeek: (recent: string, previous: string) =>
        end(
          `Die letzte Woche war schwerer als die davor: im Schnitt ${recent} Feed am Tag statt ${previous}.`,
        ),
      lighterWeek: (recent: string, previous: string) =>
        end(
          `Die letzte Woche war leichter als die davor: im Schnitt ${recent} Feed am Tag statt ${previous}.`,
        ),
      calmWeek: "In der letzten Woche gab es keinen einzigen Ausrutscher.",
      noSignals: (slips: number) =>
        `Heute keine klaren Risikosignale: ${count(slips, SLIPS)} diese Woche, keine direkt hintereinander.`,
    },
    memory: {
      workedEvening: "Der Tipp von gestern hat funktioniert: Der Abend verlief ohne Ausrutscher.",
      workedDay:
        "Der Tipp von gestern hat funktioniert: Der Tag verlief ohne Ausrutscher und im Limit.",
      missed: [
        "Gestern hat es nicht geklappt — das ist okay. Heute versuchen wir es von einer anderen Seite.",
        "Der Tipp von gestern hat nicht gewirkt, und auch das ist gut zu wissen. Heute ein anderer Ansatz.",
      ],
    },
  },

  insights: {
    timeAfter: [
      (slips: number, total: number, time: string) =>
        `In den letzten vier Wochen passierten ${slips} von ${total} Ausrutschern nach ${time}.`,
      (slips: number, total: number, time: string) =>
        `Die meisten Ausrutscher — ${slips} von ${total} in den letzten vier Wochen — beginnen nach ${time}.`,
    ],
    timeWindow: (from: string, to: string, slips: number, total: number) =>
      `Ausrutscher passieren am häufigsten zwischen ${from} und ${to}: ${slips} von ${total} in den letzten vier Wochen.`,
    topReason: [
      (cause: Cause, slips: number, total: number) =>
        `Hauptgrund deiner letzten Ausrutscher: ${cause.noun} (${slips} von ${total}).`,
      (cause: Cause, slips: number, total: number) =>
        `In den letzten drei Wochen kam es meist ${cause.because} zu Ausrutschern: ${slips} von ${total}.`,
    ],
    recurringWeekday: (weeks: number, index: number) =>
      `Schon die ${ordinal(weeks)} Woche in Folge ist der ${day(index)} dein schwerster Tag.`,
    hardWeekday: (index: number, bad: number, active: number) =>
      `Der ${day(index)} ist dein schwierigster Tag: ${bad} der letzten ${active} ${days(index)} brachten einen Ausrutscher oder lagen über dem Limit.`,
    calmWeekdayNone: (index: number, active: number) =>
      `${onDays(index)} ist das Risiko für einen Ausrutscher minimal: Keiner der letzten ${active} ${days(index)} war schwierig.`,
    calmWeekday: (index: number, bad: number, active: number) =>
      `${onDays(index)} passieren die wenigsten Ausrutscher: Nur ${bad} der letzten ${active} ${days(index)} ${bad === 1 ? "war" : "waren"} schwierig.`,
    walksNoSlips: (walks: number) =>
      `In den letzten vier Wochen gab es ${count(walks, WALKS)} — und nach keinem kam es in den drei Stunden danach zu einem Ausrutscher.`,
    walksFewSlips: (slipsAfter: number, walks: number) =>
      `Nach Spaziergängen gibt es kaum Ausrutscher: Nur ${slipsAfter} von ${walks}\u00A0Spaziergängen ${slipsAfter === 1 ? "endete" : "endeten"} in den drei Stunden danach im Feed.`,
    replacementsNoSlips: (withoutRate: number) =>
      `An Tagen mit mindestens einer Alternative gab es keinen einzigen Ausrutscher, ohne Alternative waren ${withoutRate}\u00A0% der Tage schwierig.`,
    replacementsFewer: (withRate: number, withoutRate: number) =>
      `Tage mit Alternativen sind deutlich leichter: ${withRate}\u00A0% waren schwierig gegenüber ${withoutRate}\u00A0% an den übrigen Tagen.`,
    scrollDownSteady: (average: string, change: number) =>
      `Zwei Wochen stetiger Fortschritt: im Schnitt ${average} Feed am Tag, ${change}\u00A0% weniger als zuvor, und nicht mehr Ausrutscher.`,
    scrollDown: (average: string, change: number) =>
      `In den letzten zwei Wochen warst du im Schnitt ${average} am Tag im Feed — ${change}\u00A0% weniger als in den zwei Wochen davor.`,
    scrollUp: (recent: string, previous: string) =>
      `In den letzten zwei Wochen ist es mehr Feed geworden: im Schnitt ${recent} am Tag statt ${previous} zuvor.`,
    slipsDown: (recent: number, previous: number) =>
      `Deutlich weniger Ausrutscher: ${recent} in den letzten zwei Wochen gegenüber ${previous} davor.`,
    slipsUp: (recent: number, previous: number) =>
      `In den letzten zwei Wochen gab es mehr Ausrutscher: ${recent} gegenüber ${previous} davor.`,
    eveningBetter: (time: string, recent: number, previous: number) =>
      `Deine Abende laufen besser als vor einem Monat: nach ${time} ${count(recent, SLIPS)} in diesem Monat gegenüber ${previous} im Monat davor.`,
    shorterSlips: (recent: string, previous: string) =>
      `Die Ausrutscher sind kürzer geworden: im Schnitt ${recent} statt ${previous} zwei Wochen zuvor.`,
    streakGap: (best: number, gap: number) =>
      `Bis zu deinem Bestwert — ${count(best, DAYS)} in Folge — fehlen noch ${count(gap, DAYS)}.`,
    streakRecord: (value: number) =>
      `Gerade läuft deine längste Serie: ${count(value, DAYS)} in Folge im Limit.`,
  },

  advice: {
    earlySleep: [
      "Geh heute eine halbe Stunde früher ins Bett und lass dein Handy außerhalb des Schlafzimmers laden.",
      "Geh heute lieber früher schlafen: Einem müden Gehirn erscheint der Feed immer als gute Idee — am Morgen nicht mehr.",
    ],
    phoneAway: [
      (time: string) =>
        `Leg dein Handy heute nach dem Abendessen für mindestens 15 Minuten in ein anderes Zimmer — vor allem gegen ${time}.`,
      (time: string) =>
        `Leg dein Handy gegen ${time} mit dem Display nach unten in ein anderes Zimmer und lass den Abend ohne Feed vergehen.`,
    ],
    walkHelps: [
      "Nach Spaziergängen hast du fast nie Ausrutscher. Wenn es dich heute in den Feed zieht, fang mit fünf Minuten draußen an.",
      "Spaziergänge helfen dir — das zeigen deine Daten. Wenn es dich heute in den Feed zieht, geh wenigstens fünf Minuten raus.",
    ],
    walkTry: (app: string | null) =>
      app
        ? `Wenn dich heute ${app} lockt, ersetz es durch einen kurzen Spaziergang.`
        : "Wenn dich heute der Feed lockt, ersetz ihn durch einen kurzen Spaziergang.",
    livingAlternative: [
      "Leg eine „echte“ Alternative zum Feed sichtbar hin — ein Buch, ein Notizbuch, eine Gitarre. Langeweile braucht Neues, kein endloses Scrollen.",
      "Halte eine Sache für den Moment der Langeweile bereit: eine Buchseite, ein kleines Rätsel, einen Anruf. Dann hat der Feed Konkurrenz.",
    ],
    moveApps:
      "Nimm die Feed-Apps vom Home-Bildschirm. Der Autopilot ist schneller als jeder Gedanke — gib ihm einen Schritt mehr.",
    moveApp: (app: string) =>
      `Nimm ${app} vom Home-Bildschirm deines Handys. Der Autopilot ist schneller als jeder Gedanke — gib ihm einen Schritt mehr.`,
    breatheFirst: [
      "Wenn es heute unruhig wird, atme zuerst lange aus oder mach eine SOS-Pause. Der Feed verspricht Flucht, aber die Unruhe kommt danach zurück.",
      "Wenn die Anspannung steigt, gönn dir 15 Sekunden SOS-Pause, bevor du den Feed öffnest. Das beruhigt den Körper schneller als Videos.",
    ],
    callSomeone:
      "Schreib heute einem Menschen, der dir nahesteht. Ein echtes Gespräch wärmt mehr als fremde Leben im Feed.",
    tinyStep:
      "Wenn du heute etwas aufschieben willst, mach nur den ersten Schritt von zwei Minuten. Der Feed dient meistens dazu, nicht anzufangen.",
    realRest:
      "Wähl heute eine Pause, nach der es dir wirklich leichter geht: eine Dusche, Musik mit geschlossenen Augen oder fünf Minuten Dehnen.",
    keepRhythmLogged: [
      "Das Risiko ist heute gering — bleib einfach in deinem Rhythmus. Wenn es dich in den Feed zieht, ist die Pause immer zur Hand.",
      "Heute ist ein ruhiger Tag. Du musst nichts beweisen — mach einfach weiter wie bisher.",
    ],
    keepRhythm: [
      "Das Risiko ist heute gering — bleib einfach in deinem Rhythmus. Trag abends deine Feed-Zeit ein, damit die Serie weitergeht.",
      "Heute ist ein ruhiger Tag. Vergiss nicht, abends deine Feed-Zeit einzutragen — die Serie lebt von diesen Einträgen.",
    ],
    logLearning:
      "Trag jeden Tag ein, wie viel Zeit in den Feed geflossen ist, und notiere deine Ausrutscher. In ein paar Tagen kann ich konkret über deine Gewohnheiten sprechen.",
    logToday:
      "Trag heute ein, wie viel Zeit in den Feed geflossen ist — so erkenne ich Muster leichter.",
    sosReady: [
      "Halte die SOS-Pause bereit: 15 Sekunden atmen — und die Entscheidung liegt wieder bei dir.",
      "Wenn der Impuls stark wird, tipp auf die SOS-Pause. Sie verbietet nichts, sie gibt dir nur Zeit zum Nachdenken.",
    ],
    forWeek: (tip: string) =>
      tip.replace(/\bHeute\b/g, "Diese Woche").replace(/\bheute\b/g, "diese Woche"),
  },

  replacement: {
    helped: (times: number) => `Schon ${count(times, TIMES)} kam danach kein Ausrutscher.`,
    matches: (cause: Cause) => `Passt zu deinem häufigsten Grund: ${cause.noun}.`,
    lastTime: "Beim letzten Mal kam danach kein Ausrutscher.",
  },

  reflection: {
    understanding: {
      boredom: "Langeweile ist einer der häufigsten Gründe, warum die Hand zum Feed greift.",
      fatigue:
        "Wenn die Kraft fehlt, wählt das Gehirn das Einfachste — und der Feed ist immer griffbereit.",
      relax:
        "Sich nach Erholung zu sehnen ist normal. Nur schenkt der Feed selten die Erholung, für die man ihn öffnet.",
      sleepless:
        "Wenn du nicht schlafen kannst, wirkt der Bildschirm wie eine Rettung, schiebt den Schlaf aber meist nur hinaus.",
      autopilot:
        "Der Autopilot springt vor jedem Gedanken an — das ist Gewohnheit, keine Schwäche.",
      stress:
        "Wenn du unruhig bist, verspricht der Feed eine Atempause. Verständlich, dass die Hand danach greift.",
      loneliness:
        "Wenn du dich einsam fühlst, geben fremde Leben im Feed kurz das Gefühl von Gesellschaft.",
      procrastination:
        "Der Feed hilft oft dabei, eine schwierige Aufgabe nicht anzufangen. Das kennt jeder.",
      other: "Zu verstehen, was passiert ist, ist schon ein hilfreicher Schritt.",
    },
    nextTime: {
      boredom:
        "Probier beim nächsten Mal zuerst eine kurze Alternative — Langeweile braucht Neues.",
      fatigue: "Geh heute lieber früher schlafen, statt dich auf Willenskraft zu verlassen.",
      relax: "Probier beim nächsten Mal eine Pause ohne Bildschirm — wenigstens fünf Minuten.",
      sleepless:
        "Wenn du wieder nicht schlafen kannst, dimm das Licht und leg das Handy weit weg vom Bett.",
      autopilot:
        "Reibung hilft: Nimm die App vom Home-Bildschirm, dann hat es der Autopilot schwerer.",
      stress:
        "Fang beim nächsten Mal mit einem langen Ausatmen oder einer SOS-Pause an — der Körper beruhigt sich schneller.",
      loneliness: "Schreib beim nächsten Mal einem echten Menschen — das wärmt länger.",
      procrastination:
        "Fang die Aufgabe beim nächsten Mal mit einem Zwei-Minuten-Schritt an — danach wird es meist leichter.",
      other:
        "Wenn du magst, schreib ein paar Worte dazu — so erkennt man leichter, was sich wiederholt.",
    },
    thanksForNote: "Danke, dass du es in eigenen Worten erzählst — ich merke es mir.",
    noted: "Ich merke es mir.",
    repeated: (times: number, cause: Cause) =>
      `Schon das ${ordinal(times)} Mal in zwei Wochen mit demselben Grund: ${cause.noun}.`,
    twice: "Etwas Ähnliches gab es erst neulich — ich merke es mir.",
    first: "Ich merke es mir: Je ehrlicher die Notizen, desto genauer meine Tipps.",
    lateEvening: (cause: Cause) =>
      `Später Abend und ${cause.noun} — eine Kombination, bei der der Feed fast immer gewinnt.`,
    close: [
      "Ein Ausrutscher macht nichts zunichte.",
      "Das ist eine Episode, keine Bilanz des Tages.",
      "Morgen ist ein neuer Tag.",
    ],
  },

  review: {
    titles: {
      good: "Was gut lief",
      worse: "Was schlechter wurde",
      habit: "Welche Gewohnheit besser wurde",
      weak: "Wo der Feed am häufigsten gewinnt",
      next: "Was du nächste Woche probieren kannst",
    },
    savedMovies: (duration: string, movies: number) =>
      `Diese Woche hat dir ${duration} zurückgegeben — genug für ${movies === 1 ? "einen ganzen Film" : `${movies} Filme`}.`,
    saved: (duration: string) => `Diese Woche hat dir ${duration} zurückgegeben.`,
    daysInLimit: (inLimit: number, logged: number) =>
      `${inLimit} von ${logged}\u00A0Tagen im Limit.`,
    fewerSlips: (now: number, before: number) =>
      `Weniger Ausrutscher: ${now} statt ${before} in der Vorwoche.`,
    impulses: (percent: number) => `${percent}\u00A0% der Impulse gingen ohne Feed vorüber.`,
    replacements: (replacements: number) => `${count(replacements, ALTERNATIVES)} statt Feed.`,
    noWins: [
      "Klare Erfolge gab es diese Woche nur wenige — dafür sieht man jetzt, worauf du aufbauen kannst.",
      "Eine schwierige Woche. Das ist kein Scheitern, sondern Daten: Daran sieht man schon, wo du vorbauen kannst.",
    ],
    firstWeek: "Noch kein Vergleich möglich — das ist die erste Woche mit Einträgen.",
    moreSlips: (now: number, before: number) => `Mehr Ausrutscher: ${now} statt ${before}.`,
    moreScroll: (now: string, before: string) =>
      `Im Schnitt ${now} Feed am Tag statt ${before} in der Vorwoche.`,
    heldLess: (now: number, before: number) =>
      `Widerstehen hat seltener geklappt: ${now}\u00A0% statt ${before}\u00A0%.`,
    nothingWorse: "Keine spürbaren Verschlechterungen.",
    habitFirstWeek: "Noch kein Vergleich möglich — in einer Woche siehst du hier die Entwicklung.",
    eveningHabit: (time: string, now: number, before: number) =>
      `Abende: nach ${time} ${count(now, SLIPS)} statt ${before} in der Vorwoche.`,
    reasonHabit: (cause: Cause, now: number, before: number) =>
      `Weniger Ausrutscher ${cause.because}: ${now} statt ${before} in der Vorwoche.`,
    switchHabit: (now: number, before: number) =>
      `Die Gewohnheit umzuschalten wird stärker: ${count(now, ALTERNATIVES)} statt ${before} in der Vorwoche.`,
    scrollHabit: (now: string, before: string) =>
      end(`Die Feed-Zeit ist gesunken: ${now} am Tag statt ${before}.`),
    noHabit:
      "Noch hat sich keine Gewohnheit deutlich verändert — für eine einzelne Woche ist das normal.",
    noWeakSpots: "Keine Schwachstellen in Sicht: die ganze Woche kein einziger Ausrutscher.",
    singleSlip: (index: number, time: string, cause: Cause | null) =>
      `Es gab einen Ausrutscher — am ${day(index)} gegen ${time}${cause ? `, ${cause.because}` : ""}.`,
    hardest: (index: number | null, time: string | null, cause: Cause | null) => {
      const where = [index !== null ? `am ${day(index)}` : null, time && `gegen ${time}`]
        .filter(Boolean)
        .join(" ");
      const why = cause ? ` — meist ${cause.because}` : "";
      return where
        ? `Am schwersten war es ${where}${why}.`
        : `Schwierige Momente gab es zu ganz unterschiedlichen Zeiten${why}.`;
    },
    goal: (tip: string, target: number) =>
      `${tip} Und ein kleines Ziel: ${target} von 7 Tagen im Limit.`,
    logDaily: (tip: string) =>
      `${tip} Und versuch, deine Feed-Zeit jeden Tag einzutragen — dann wird der nächste Rückblick genauer.`,
  },

  ui: {
    badge: "Ihr persönlicher Coach",
    briefing: {
      learningCaption: "Ich lerne deine Gewohnheiten kennen",
      caption: "Briefing für heute",
      learning: (needed: number) =>
        `Noch sammle ich Informationen — die Prognose erscheint, sobald es ${count(needed, DAYS)} mit Einträgen gibt.`,
      progress: (active: number, needed: number) =>
        `Tage mit Einträgen: ${active} von ${needed}. Alles zählt: Feed-Zeit, SOS-Pause, Alternative oder Ausrutscher.`,
      riskTitle: "Risiko für endloses Scrollen heute",
      riskA11y: (level: string) => `Risiko für endloses Scrollen heute: ${level}`,
      riskLevels: { low: "Niedrig", medium: "Mittel", high: "Hoch" },
      why: "Warum: ",
      adviceTitle: "Tipp für heute",
      start: (title: string) => `Starten: ${title}`,
    },
    insightsTitle: "Was die Einträge zeigen",
    reflection: {
      title: "Was ist passiert?",
      subtitle: "Ohne Bewertung — nur um zu sehen, was sich wiederholt.",
      replyTitle: "Verstehe",
      placeholder: "Oder in eigenen Worten — optional",
      noteA11y: "Was passiert ist, in eigenen Worten",
      done: "Fertig",
      notNow: "Nicht jetzt",
      tryReplacement: (title: string) => `Ausprobieren: ${title}`,
      thanks: "Danke",
    },
    weeklyCaption: "Wochenrückblick",
  },
};
