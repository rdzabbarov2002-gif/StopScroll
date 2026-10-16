// Shared helpers for the StopScroll entry-analysis benchmark (see README.md).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const EVAL_DIR = dirname(fileURLToPath(import.meta.url));
export const readJson = (name) => JSON.parse(readFileSync(join(EVAL_DIR, name), "utf8"));

/** The configurations compared. Effort "low" is the production default for /entry. */
export const ARMS = {
  nano: { model: "gpt-5.4-nano", effort: "low" },
  mini: { model: "gpt-5.4-mini", effort: "low" },
  "nano-medium": { model: "gpt-5.4-nano", effort: "medium" },
  "mini-minimal": { model: "gpt-5.4-mini", effort: "none" },
};

export function args(defaults) {
  const result = { ...defaults };
  for (let index = 2; index < process.argv.length; index += 1) {
    const key = process.argv[index].replace(/^--/, "");
    const next = process.argv[index + 1];
    if (next === undefined || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

export function resultsDir(name) {
  const dir = join(EVAL_DIR, "results", name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export const appendJsonl = (path, value) => appendFileSync(path, `${JSON.stringify(value)}\n`);

/** Runs `tasks` with at most `limit` in flight. */
export async function pool(tasks, limit, onDone = () => undefined) {
  let next = 0;
  let done = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      await task();
      onDone(++done, tasks.length);
    }
  });
  await Promise.all(workers);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Lowercase, ё → е: for matching Russian word stems. */
export const norm = (value) => String(value ?? "").toLowerCase().replace(/ё/g, "е");

export const hasStem = (text, stems) => stems.some((stem) => norm(text).includes(norm(stem)));

/** Content-word stems of a phrase (first five letters of words of four letters or more). */
export const phraseStems = (phrase) =>
  norm(phrase)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 4)
    .map((word) => word.slice(0, 5));

export function cost(model, usage, prices) {
  const price = prices[model];
  if (!price || !usage) return 0;
  const cached = usage.cached ?? 0;
  return (
    ((usage.input - cached) * price.input + cached * price.cached + usage.output * price.output) /
    1e6
  );
}

/** A stable pseudo-random bit per id (for blinding the order in the judge). */
export function flip(id) {
  let hash = 2166136261;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash & 1) === 1;
}
