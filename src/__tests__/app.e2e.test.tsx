/**
 * The whole app as a React Native tree (not the web build): the real providers, navigation,
 * screens, storage and AI engine, rendered with React Native's host components. Only what has no
 * device here is replaced: the store SDK, the safe-area insets, the stylesheet compiled by Metro,
 * and the AI server — a stand-in that follows the server's contract and answers in the requested
 * language.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// The store SDK (its own native module; in Expo Go it runs in preview mode): not part of the check.
jest.mock("react-native-purchases", () => {
  const names = (list: string[]) => Object.fromEntries(list.map((name) => [name, name]));
  return {
    __esModule: true,
    default: {
      configure: jest.fn(),
      setLogLevel: jest.fn(async () => undefined),
      getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
      getOfferings: jest.fn(async () => ({ current: null, all: {} })),
      addCustomerInfoUpdateListener: jest.fn(),
      removeCustomerInfoUpdateListener: jest.fn(),
      purchasePackage: jest.fn(),
      restorePurchases: jest.fn(),
      checkTrialOrIntroductoryPriceEligibility: jest.fn(async () => ({})),
    },
    LOG_LEVEL: names(["WARN", "ERROR"]),
    PACKAGE_TYPE: names([
      "MONTHLY",
      "ANNUAL",
      "LIFETIME",
      "SIX_MONTH",
      "THREE_MONTH",
      "TWO_MONTH",
      "WEEKLY",
    ]),
    INTRO_ELIGIBILITY_STATUS: names(["INTRO_ELIGIBILITY_STATUS_ELIGIBLE"]),
    PURCHASES_ERROR_CODE: names(["PURCHASE_CANCELLED_ERROR", "NETWORK_ERROR"]),
  };
});

// Without a device there are no insets: the provider's own test double renders right away.
jest.mock(
  "react-native-safe-area-context",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("react-native-safe-area-context/jest/mock").default,
);

// Tailwind's CSS is compiled by Metro (NativeWind); the tree renders without the styles here.
jest.mock("../../global.css", () => ({}));

// The app is built with the AI server's address (read when the client module loads).
process.env.EXPO_PUBLIC_AI_URL = "https://ai.test";

/* eslint-disable @typescript-eslint/no-require-imports */
const App = require("../../App").default as () => React.JSX.Element;
const { navigationRef } =
  require("../navigation/linking") as typeof import("../navigation/linking");
const i18n = require("../i18n") as typeof import("../i18n");
const { CATALOG } = require("../i18n/messages") as typeof import("../i18n/messages");
const { STORAGE_KEY } = require("../utils/storage") as typeof import("../utils/storage");
const { createDemoState } = require("../utils/demo") as typeof import("../utils/demo");
const { dayKey } = require("../utils/date") as typeof import("../utils/date");
const { AI_META_KEY } = require("../ai/storage") as typeof import("../ai/storage");
/* eslint-enable @typescript-eslint/no-require-imports */

type Lang = import("../i18n").LanguageCode;
const LANGS: Lang[] = ["ru", "en", "tr", "de", "fr"];
const NATIVE: Record<Lang, string> = {
  ru: "Русский",
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fr: "Français",
};

/* ------------------------------------------------------------------------------------------- */
/* The AI server stand-in: the contract of server/ai-coach, answers in the requested language.  */

const P = {
  cause: {
    ru: "усталость после работы",
    en: "tiredness after work",
    tr: "iş sonrası yorgunluk",
    de: "Müdigkeit nach der Arbeit",
    fr: "la fatigue après le travail",
  },
  emotion: {
    ru: "опустошённость",
    en: "drained",
    tr: "tükenmişlik",
    de: "Erschöpfung",
    fr: "épuisement",
  },
  tag: { ru: "усталость", en: "tiredness", tr: "yorgunluk", de: "müdigkeit", fr: "fatigue" },
  profile: {
    ru: "Лента чаще всего побеждает вечером после работы.",
    en: "The feed wins most often in the evening after work.",
    tr: "Akış en çok işten sonra akşamları kazanıyor.",
    de: "Der Feed gewinnt meist abends nach der Arbeit.",
    fr: "Le fil l’emporte surtout le soir après le travail.",
  },
  conclusion: {
    ru: "Похоже, лента побеждает не от скуки, а от вечерней усталости.",
    en: "It looks like the feed wins not out of boredom but out of evening tiredness.",
    tr: "Görünüşe göre akış can sıkıntısından değil, akşam yorgunluğundan kazanıyor.",
    de: "Offenbar gewinnt der Feed nicht aus Langeweile, sondern aus abendlicher Müdigkeit.",
    fr: "Il semble que le fil l’emporte non par ennui, mais par fatigue du soir.",
  },
  trigger: {
    ru: "Приход домой после работы",
    en: "Getting home after work",
    tr: "İşten eve dönüş",
    de: "Heimkommen nach der Arbeit",
    fr: "Le retour à la maison après le travail",
  },
  hypothesis: {
    ru: "Вечерние срывы связаны с усталостью",
    en: "Evening slips are tied to tiredness",
    tr: "Akşam kaçamakları yorgunlukla bağlantılı",
    de: "Abendliche Ausrutscher hängen mit Müdigkeit zusammen",
    fr: "Les écarts du soir sont liés à la fatigue",
  },
  zone: {
    ru: "Вечер после работы",
    en: "Evening after work",
    tr: "İş sonrası akşam",
    de: "Abend nach der Arbeit",
    fr: "Le soir après le travail",
  },
  tip: {
    ru: "Десять минут отдыха без телефона",
    en: "Ten minutes of rest without the phone",
    tr: "Telefonsuz on dakika dinlenme",
    de: "Zehn Minuten Pause ohne Handy",
    fr: "Dix minutes de repos sans téléphone",
  },
  question: {
    ru: "Бывает ли так в выходные?",
    en: "Does it happen on weekends too?",
    tr: "Hafta sonları da oluyor mu?",
    de: "Passiert das auch am Wochenende?",
    fr: "Cela arrive-t-il aussi le week-end ?",
  },
  challenge: {
    ru: "Десять минут тишины",
    en: "Ten quiet minutes",
    tr: "On dakika sessizlik",
    de: "Zehn ruhige Minuten",
    fr: "Dix minutes au calme",
  },
} satisfies Record<string, Record<Lang, string>>;

const say = (key: keyof typeof P, lang: Lang) => P[key][lang];
/** A known phrase in any language → the same phrase in `lang` (what /translate does). */
function translate(text: string, lang: Lang) {
  for (const forms of Object.values(P)) {
    if (Object.values(forms).some((value) => value.toLowerCase() === text.toLowerCase())) {
      const value = forms[lang];
      return text === text.toLowerCase() ? value.toLowerCase() : value;
    }
  }
  return text;
}

interface Call {
  path: string;
  language: string;
  body: Record<string, unknown>;
}
let calls: Call[] = [];
/** Paths that answer with an error (to check that a failure never blocks the rest). */
let failing = new Set<string>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function answer(path: string, body: Record<string, unknown>, lang: Lang): [number, unknown] {
  if (path === "/entry") {
    const entries = body.entries;
    if (!Array.isArray(entries) || entries.length < 1 || entries.length > 6) return [400, {}];
    const memory = body.memory as { profile: string | null; hypotheses: { id: string }[] };
    return [
      200,
      {
        results: entries.map((entry: { n: number; text: string }) => ({
          n: entry.n,
          enough: entry.text.length > 25,
          cause: say("cause", lang),
          emotion: say("emotion", lang),
          context: null,
          behavior: null,
          insight: null,
          missing: null,
          tags: [say("tag", lang)],
          gist: entry.text.slice(0, 80),
          conf: 70,
          votes: memory.profile
            ? memory.hypotheses.slice(0, 1).map((item) => ({ id: item.id, effect: "support" }))
            : [],
        })),
      },
    ];
  }
  if (path === "/deep") {
    if (!isRecord(body.stats) || !Array.isArray(body.newEntries)) return [400, {}];
    const first = body.memory === null;
    const op = (fields: Record<string, unknown>) => ({
      op: "add",
      id: null,
      kind: null,
      text: null,
      note: null,
      weekday: null,
      from: null,
      to: null,
      when: null,
      until: null,
      cites: [],
      why: null,
      ...fields,
    });
    const policy = body.policy as { questions: boolean; challenge: boolean };
    return [
      200,
      {
        rereads: ((body.reread as { ref: string }[]) ?? []).map((item) => ({
          ref: item.ref,
          verdict: "keep",
          cause: null,
          tags: [],
          gist: null,
          conf: 70,
          votes: [],
          why: "",
        })),
        beliefs: first
          ? [
              op({ kind: "trigger", text: say("trigger", lang), cites: ["r1"] }),
              op({ kind: "hypothesis", text: say("hypothesis", lang) }),
              op({ kind: "zone", text: say("zone", lang), from: 21, to: 23 }),
              op({ kind: "tip", text: say("tip", lang), when: "evening" }),
            ]
          : [],
        profile: say("profile", lang),
        conclusion: say("conclusion", lang),
        emotions: null,
        strengths: null,
        weaknesses: null,
        changes: null,
        improvements: null,
        worsenings: null,
        events: [],
        corrections: [],
        chapter: null,
        openQuestions: [],
        questions: policy.questions
          ? [{ text: say("question", lang), kind: "yes_no", options: [], about: "h1" }]
          : [],
        challenge: policy.challenge
          ? {
              title: say("challenge", lang),
              description: say("challenge", lang),
              durationDays: 3,
              focus: "evening",
              expectation: say("challenge", lang),
              tip: "p1",
            }
          : null,
      },
    ];
  }
  if (path === "/translate") {
    const texts = body.texts;
    if (!Array.isArray(texts) || texts.length < 1 || texts.length > 80) return [400, {}];
    return [200, { texts: texts.map((text: string) => translate(text, lang)) }];
  }
  if (path === "/phrase") return [200, { texts: body.texts }];
  return [404, {}];
}

/* ------------------------------------------------------------------------------------------- */
/* Driving the tree.                                                                            */

let tree: ReactTestRenderer | null = null;

const wait = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

const textOf = (node: ReactTestInstance): string =>
  node.children.map((child) => (typeof child === "string" ? child : textOf(child))).join("");

/** Every text on screen (host Text nodes). */
function screenTexts(): string[] {
  return tree!.root
    .findAll((node) => node.type === "Text")
    .map(textOf)
    .filter(Boolean);
}
const visible = (text: string) => screenTexts().some((item) => item.includes(text));

async function until(check: () => boolean, what: string, timeout = 8000) {
  for (let spent = 0; spent < timeout; spent += 100) {
    if (check()) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for: ${what}\nOn screen: ${screenTexts().join(" | ")}`);
}

const pressable = (node: ReactTestInstance | null): ReactTestInstance | null => {
  let current = node;
  while (current) {
    if (typeof current.props.onPress === "function" && current.props.disabled !== true) {
      return current;
    }
    current = current.parent;
  }
  return null;
};

/** Taps the control that shows exactly this text. */
async function tap(text: string) {
  const node = tree!.root.findAll((item) => item.type === "Text" && textOf(item) === text)[0];
  const target = pressable(node ?? null);
  if (!target) throw new Error(`Nothing to tap with the text "${text}"`);
  await act(async () => {
    target.props.onPress({ nativeEvent: {} });
  });
  await wait(50);
}

/** Taps the control with this text inside a component (e.g. the AI tab's consent card). */
async function tapIn(component: string, text: string) {
  const scope = tree!.root.findAll(
    (item) =>
      typeof item.type === "function" && (item.type as { name?: string }).name === component,
  )[0];
  const node = scope?.findAll((item) => item.type === "Text" && textOf(item) === text)[0];
  const target = pressable(node ?? null);
  if (!target) throw new Error(`Nothing to tap with the text "${text}" in ${component}`);
  await act(async () => {
    target.props.onPress({ nativeEvent: {} });
  });
  await wait(50);
}

async function type(label: string, value: string) {
  const input = tree!.root.findAll(
    (item) =>
      item.props.accessibilityLabel === label && typeof item.props.onChangeText === "function",
  )[0];
  if (!input) throw new Error(`No text field "${label}"`);
  await act(async () => {
    input.props.onChangeText(value);
  });
}

async function go(route: string, params?: object) {
  await act(async () => {
     
    (navigationRef.navigate as any)(route, params);
  });
  await wait(80);
}

async function launch() {
  await act(async () => {
    tree = create(<App />);
  });
  await wait(300);
}

async function close() {
  if (tree) {
    await act(async () => {
      tree!.unmount();
    });
    tree = null;
  }
}

/** The first launch: a language, then onboarding. */
async function firstLaunch(lang: Lang) {
  await launch();
  await until(() => visible("Language · "), "the language picker");
  await tap(NATIVE[lang]);
  await tap(CATALOG[lang].language.continue);
  const o = CATALOG[lang].onboarding;
  await until(() => visible(o.start), "onboarding");
  await tap(o.start);
  await tap(o.baseline.next);
  await tap(o.goal.done);
  await until(() => visible(CATALOG[lang].ai.impulse.question), "the home screen");
}

async function writeEntry(lang: Lang, text: string) {
  const a = CATALOG[lang].ai.impulse;
  await go("Main", { screen: "Home" });
  await type(a.inputA11y, text);
  await tap(a.opened);
  await tap(a.save);
}

async function storedMeta() {
  return JSON.parse((await AsyncStorage.getItem(AI_META_KEY)) ?? "{}") as Record<
    string,
    unknown
  > & {
    memory: { conclusion: string; beliefs: { id: string; text: string; status: string }[] } | null;
    memoryLanguage: string | null;
    deletedSinceDeep: unknown[];
    consent: boolean | null;
  };
}

async function switchLanguage(lang: Lang) {
  await go("Language");
  await tap(NATIVE[lang]);
  await tap(CATALOG[lang].language.continue);
  await wait(200);
}

const CYRILLIC = /[Ѐ-ӿ]/;
/** Texts that must never reach the screen. */
const BROKEN = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/;

/** Every route of the app, as a user can reach it. */
const ROUTES: [string, object?][] = [
  ["Main", { screen: "Home" }],
  ["Main", { screen: "AI" }],
  ["Main", { screen: "Replacements" }],
  ["Main", { screen: "Stats" }],
  ["Main", { screen: "Journal" }],
  ["Settings"],
  ["Privacy"],
  ["Paywall"],
  ["WeeklyReport"],
  ["Achievements"],
  ["Intercept"],
  ["Replacement", { id: "squats" }],
  ["Language"],
];

const consoleErrors: string[] = [];

beforeEach(async () => {
  await AsyncStorage.clear();
  i18n.setLanguage("ru");
  calls = [];
  failing = new Set();
  consoleErrors.length = 0;
  jest.spyOn(console, "error").mockImplementation((...parts: unknown[]) => {
    consoleErrors.push(parts.map(String).join(" "));
  });
  global.fetch = jest.fn(async (input: unknown, init?: { body?: unknown }) => {
    const url = String(input);
    const path = new URL(url).pathname;
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    const language = String(body.language ?? "ru") as Lang;
    calls.push({ path, language, body });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const [status, json] = failing.has(path) ? [503, {}] : answer(path, body, language);
    return { status, ok: status >= 200 && status < 300, json: async () => json } as Response;
  }) as typeof fetch;
});

afterEach(async () => {
  await close();
  jest.restoreAllMocks();
});

// A whole app per scenario: these take seconds, not milliseconds.
jest.setTimeout(60_000);

describe("StopScroll as a React Native app", () => {
  it("asks for the language on the very first launch and nothing else is reachable", async () => {
    await launch();
    await until(() => visible("Language · Dil"), "the picker");
    // Continue does nothing until a language is picked.
    const before = screenTexts().join(" ");
    await tap("Continue").catch(() => undefined);
    expect(screenTexts().join(" ")).toBe(before);
    expect(navigationRef.isReady()).toBe(false);
    await tap("Deutsch");
    await tap("Weiter");
    await until(() => visible(CATALOG.de.onboarding.start), "German onboarding");
    // Saved: the next launch goes straight on.
    await close();
    await launch();
    await until(() => visible(CATALOG.de.onboarding.start), "onboarding after a relaunch");
    expect(visible("Language · Dil")).toBe(false);
  });

  it.each(LANGS)("works end to end in %s: entries, deep analysis, every screen", async (lang) => {
    await firstLaunch(lang);
    const t = CATALOG[lang];

    // An entry, the consent, the analysis of the day and the first deep analysis.
    await writeEntry(lang, `Entry in ${lang}: came home exhausted after a long shift`);
    await until(() => visible(t.ai.impulse.needConsent), "the consent note");
    await go("Main", { screen: "AI" });
    await tapIn("ConsentCard", t.ai.consent.allow);
    await until(() => calls.some((call) => call.path === "/deep"), "the deep analysis", 10000);
    await until(() => visible(say("conclusion", lang)), "the conclusion on the AI tab");
    expect(calls.every((call) => call.language === lang)).toBe(true);
    expect(visible(say("trigger", lang))).toBe(true);
    expect(visible(say("question", lang))).toBe(true);
    // The analysis of the day under the entry.
    await go("Main", { screen: "Home" });

    // Every screen renders in this language, with nothing broken on it.
    i18n.setLanguage(lang);
    const userText = `Entry in ${lang}`;
    for (const [route, params] of ROUTES) {
      await go(route, params);
      const shown = screenTexts().filter((text) => !text.startsWith(userText));
      const broken = shown.filter((text) => BROKEN.test(text));
      expect({ route, broken }).toEqual({ route, broken: [] });
      if (lang !== "ru") {
        const russian = shown.filter((text) => CYRILLIC.test(text) && text !== NATIVE.ru);
        expect({ route, russian }).toEqual({ route, russian: [] });
      }
    }
    expect(consoleErrors.filter((line) => !/act\(/.test(line))).toEqual([]);
  });

  it.each(LANGS)("shows every screen with a full history in %s", async (lang) => {
    // A user with weeks of records: charts, patterns, the weekly report, achievements.
    i18n.setLanguage(lang);
    const app = { ...createDemoState(dayKey(), "light"), onboarded: true, language: lang };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(app));
    await launch();
    await until(() => visible(CATALOG[lang].ai.impulse.question), "the home screen");
    for (const [route, params] of ROUTES) {
      await go(route, params);
      const shown = screenTexts();
      expect({ route, broken: shown.filter((text) => BROKEN.test(text)) }).toEqual({
        route,
        broken: [],
      });
      if (lang !== "ru") {
        const russian = shown.filter((text) => CYRILLIC.test(text) && text !== NATIVE.ru);
        expect({ route, russian }).toEqual({ route, russian: [] });
      }
    }
    expect(consoleErrors.filter((line) => !/act\(/.test(line))).toEqual([]);
  });

  it("deletes entries and tells the next analysis about the ones it already took in", async () => {
    await firstLaunch("en");
    await writeEntry("en", "Opened the feed right after a call with my manager");
    await go("Main", { screen: "AI" });
    await tapIn("ConsentCard", CATALOG.en.ai.consent.allow);
    await until(() => calls.some((call) => call.path === "/deep"), "the deep analysis");
    await wait(300);
    // Open the entry in the history and delete it.
    await tap("Opened the feed right after a call with my manager");
    await tap(CATALOG.en.ai.history.deleteEntry);
    await tap(CATALOG.en.ai.history.delete);
    await until(() => !visible("Opened the feed right after a call"), "the entry gone");
    await wait(300);
    const meta = await storedMeta();
    expect(meta.deletedSinceDeep).toHaveLength(1);
    expect(JSON.stringify(meta)).not.toMatch(/call with my manager/);
  });

  it("translates the memory on a language change, several times in a row", async () => {
    await firstLaunch("en");
    await writeEntry("en", "Came home tired and scrolled for an hour before dinner");
    await go("Main", { screen: "AI" });
    await tapIn("ConsentCard", CATALOG.en.ai.consent.allow);
    await until(() => visible(say("conclusion", "en")), "the English conclusion");

    // Three switches without waiting, then one more after it settles.
    for (const lang of ["de", "fr", "tr"] as Lang[]) await switchLanguage(lang);
    await go("Main", { screen: "AI" });
    await until(() => visible(say("conclusion", "tr")), "the Turkish conclusion", 10000);
    expect(visible(CATALOG.tr.ai.screen.title)).toBe(true);
    expect(visible(say("trigger", "tr"))).toBe(true);
    let meta = await storedMeta();
    expect(meta.memoryLanguage).toBe("tr");

    await switchLanguage("ru");
    await go("Main", { screen: "AI" });
    await until(() => visible(say("conclusion", "ru")), "the Russian conclusion", 10000);
    meta = await storedMeta();
    expect(meta.memoryLanguage).toBe("ru");
    expect(meta.memory!.beliefs.map((belief) => belief.text)).toContain(say("trigger", "ru"));
    // The entry's analysis of the day stays as it was shown (English).
    await tap("Came home tired and scrolled for an hour before dinner");
    expect(visible(say("cause", "en"))).toBe(true);
  });

  it("keeps analysing when the translation fails, and translates later", async () => {
    await firstLaunch("en");
    await writeEntry("en", "Scrolled in bed instead of sleeping, again");
    await go("Main", { screen: "AI" });
    await tapIn("ConsentCard", CATALOG.en.ai.consent.allow);
    await until(() => visible(say("conclusion", "en")), "the English conclusion");
    failing = new Set(["/translate"]);
    await switchLanguage("de");
    await writeEntry("de", "Nach dem Abendessen direkt Reels geöffnet, ohne Grund");
    await until(
      () => calls.some((call) => call.path === "/entry" && call.language === "de"),
      "the new entry analysed while the translation waits",
    );
    expect((await storedMeta()).memoryLanguage).toBe("en");
  });

  it("reads the earlier versions' data and carries on", async () => {
    const today = dayKey();
    // An install from before languages and the new memory: no language, the v2 AI memory.
    const app = { ...createDemoState(today, "light"), onboarded: true } as Record<string, unknown>;
    delete app.language;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(app));
    await AsyncStorage.setItem(
      AI_META_KEY,
      JSON.stringify({
        consent: true,
        deepAt: Date.now() - 2 * 86_400_000,
        memorySince: Date.now() - 40 * 86_400_000,
        deepRecordsKey: "old",
        memory: {
          profile: "Срывы чаще вечером после работы.",
          conclusion: "Главное — вечерняя усталость.",
          triggers: [{ title: "После работы", note: "Дома, сразу после прихода." }],
          emotions: [],
          dangerZones: [{ title: "Вечер", note: "После 21:00", weekday: null, from: 21, to: 23 }],
          strengths: [],
          weaknesses: [],
          tips: [{ text: "Прогулка после работы", when: "evening" }],
          events: [],
          changes: [],
          improvements: [],
          worsenings: [],
          hypotheses: [
            { id: "h1", text: "Прогулки помогают", status: "supported", support: 6, against: 1 },
          ],
          openQuestions: [],
        },
        answers: [],
      }),
    );
    const month = today.slice(0, 7);
    await AsyncStorage.setItem(
      `@stopscroll/ai/entries/${month}`,
      JSON.stringify([
        {
          id: "old1",
          timestamp: Date.now() - 86_400_000,
          text: "Очень устал после работы, пришёл и открыл ленту",
          outcome: "opened",
          status: "done",
          attempts: 0,
          analysis: {
            enough: true,
            cause: "усталость",
            emotion: null,
            context: null,
            behavior: null,
            explanation: null,
            missing: null,
            tags: ["усталость"],
            gist: "устал после работы",
            analyzedAt: Date.now() - 86_400_000,
          },
          inInsights: true,
        },
      ]),
    );

    await launch();
    // The language is asked once; everything learned before is still there.
    await until(() => visible("Language · Dil"), "the picker for an old install");
    await tap("Русский");
    await tap("Продолжить");
    await go("Main", { screen: "AI" });
    await until(() => visible("Главное — вечерняя усталость."), "the old conclusion");
    expect(visible("После работы")).toBe(true);
    await tap("Очень устал после работы, пришёл и открыл ленту");
    expect(visible("усталость")).toBe(true);
    // The next change saves everything in the current format.
    await writeEntry("ru", "Снова открыл ленту после ужина, хотя собирался читать");
    await until(() => calls.some((call) => call.path === "/entry"), "the new entry analysed");
    await wait(500);
    const meta = await storedMeta();
    expect(meta.memoryLanguage).toBe("ru");
    expect(meta.memory!.beliefs.map((belief) => belief.id)).toEqual(
      expect.arrayContaining(["h1", "t1", "z1", "p1"]),
    );
  });
});
