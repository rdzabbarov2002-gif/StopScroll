import { afterEach, describe, expect, it } from "@jest/globals";

import { LANGUAGE_CODES, countOf, getLanguage, m, plural, setLanguage } from "..";
import { CATALOG } from "../messages";
import { pluralCategory } from "../plural";

/** Every leaf of a message tree: its path and value. */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (typeof value === "function" || typeof value !== "object" || value === null) {
    return [[path, value]];
  }
  return Object.entries(value).flatMap(([key, item]) =>
    leaves(item, path ? `${path}.${key}` : key),
  );
}

/** Plural forms only Russian needs ("few", "many") are optional elsewhere. */
const shape = (value: unknown) =>
  leaves(value)
    .filter(([path]) => !/\.(few|many)$/.test(path))
    .map(([path, item]) => [path, typeof item]);

describe("message catalogs", () => {
  const source = CATALOG.ru;

  it.each(LANGUAGE_CODES.filter((code) => code !== "ru"))(
    "%s has every message of the Russian source, with the same parameters",
    (code) => {
      expect(shape(CATALOG[code])).toEqual(shape(source));
      // A language may need fewer parameters (Turkish keeps "3 gün" singular), never more.
      const russian = new Map(leaves(source));
      const extra = leaves(CATALOG[code])
        .filter(([path, item]) => {
          const base = russian.get(path);
          return (
            typeof item === "function" && typeof base === "function" && item.length > base.length
          );
        })
        .map(([path]) => path);
      expect(extra).toEqual([]);
    },
  );

  it.each(LANGUAGE_CODES.filter((code) => code !== "ru"))(
    "%s leaves no text empty where the Russian one has words",
    (code) => {
      const russian = new Map(leaves(source));
      const empty = leaves(CATALOG[code])
        .filter(([path, value]) => value === "" && russian.get(path) !== "")
        .map(([path]) => path);
      expect(empty).toEqual([]);
    },
  );
});

describe("plural rules", () => {
  it("picks the form each language needs", () => {
    expect([1, 2, 5, 11, 21, 22, 25, 1.5].map((n) => pluralCategory("ru", n))).toEqual([
      "one",
      "few",
      "many",
      "many",
      "one",
      "few",
      "many",
      "other",
    ]);
    expect([0, 1, 1.5, 2].map((n) => pluralCategory("fr", n))).toEqual([
      "one",
      "one",
      "one",
      "other",
    ]);
    expect([0, 1, 2].map((n) => pluralCategory("en", n))).toEqual(["other", "one", "other"]);
  });
});

describe("the current language", () => {
  afterEach(() => setLanguage("ru"));

  it("switches the catalogs' texts too (no copy of them is frozen at startup)", () => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const catalog = require("../../utils/catalog") as typeof import("../../utils/catalog");
    const { ACHIEVEMENTS } =
      require("../../utils/achievements") as typeof import("../../utils/achievements");
    /* eslint-enable @typescript-eslint/no-require-imports */
    const snapshot = () => [
      catalog.REPLACEMENTS[0]!.title,
      catalog.REPLACEMENTS[0]!.steps[0],
      catalog.EXERCISES[0]!.title,
      catalog.EXERCISES[0]!.prompts[0]!.text,
      catalog.EQUIVALENTS[0]!.caption,
      catalog.TRIGGERS[0]!.label,
      catalog.CATEGORIES[0]!.label,
      ACHIEVEMENTS[0]!.title,
    ];
    const russian = snapshot();
    setLanguage("en");
    const english = snapshot();
    english.forEach((text, index) => expect(text).not.toBe(russian[index]));
    expect(english[0]).toBe(
      CATALOG.en.catalog.items[catalog.REPLACEMENTS[0]!.id as "squats"].title,
    );
  });

  it("switches every message at once", () => {
    const days = { one: "день", few: "дня", many: "дней", other: "дня" };
    expect(getLanguage()).toBe("ru");
    expect(countOf(3, days)).toBe("3 дня");
    expect(plural(5, days)).toBe("дней");
    const russian = m().language.continue;
    setLanguage("en");
    expect(m().language.continue).not.toBe(russian);
    expect(m().language.continue).toBe(CATALOG.en.language.continue);
  });
});
