// A quick check of the deployed server with the requests the app itself sends (smoke.json, taken
// from the app's end-to-end test): every route answers, the app's own code can read the answer,
// and the answer is in the requested language. A handful of calls — a few cents.
//
//   node --no-warnings --import ./eval/ts-hooks.mjs eval/smoke.mjs https://<worker>.workers.dev
//   optional: AI_TOKEN=<the APP_TOKEN secret, if the server has one>
import { appendFileSync } from "node:fs";

import { parseEntryResult } from "../../../src/ai/parse.ts";
import { readJson } from "./lib.mjs";

const base = String(process.argv[2] ?? "")
  .trim()
  .replace(/\/+$/, "");
if (!/^https?:\/\/\S+$/.test(base)) {
  console.error("Usage: smoke.mjs https://<the server's address>");
  process.exit(2);
}

const CYRILLIC = /[А-Яа-яЁё]/;
/** Russian answers have Russian words; English ones have none. */
const inLanguage = (texts, language) => {
  const joined = texts.filter((item) => typeof item === "string").join(" ");
  return language === "ru" ? CYRILLIC.test(joined) : joined.trim() !== "" && !CYRILLIC.test(joined);
};
const ERRORS = {
  401: "the server wants the app token (AI_TOKEN)",
  429: "too many requests or no money on the OpenAI balance",
  500: "server setup: the OpenAI key or the model (see the Worker's logs)",
  502: "the model's answer did not fit the format",
  503: "OpenAI is unavailable or the balance is empty",
  504: "OpenAI took too long",
};

/** What the app takes from each answer: problems, the texts to check the language of, a sample. */
function read(path, body, answer) {
  if (path === "/entry") {
    const raw = answer.results?.find((item) => item?.n === 1);
    const parsed = parseEntryResult(raw, Date.now(), body.entries[0].text.length);
    if (!parsed)
      return { problems: ["the app could not read the analysis"], texts: [], sample: [] };
    const { cause, emotion, gist, explanation } = parsed.analysis;
    return {
      problems: [],
      texts: [cause, emotion, gist, explanation],
      sample: [`cause: ${cause}`, `emotion: ${emotion}`, `gist: ${gist}`],
    };
  }
  if (path === "/deep") {
    const problems = [];
    if (!answer.profile || !answer.conclusion) problems.push("no profile or conclusion");
    const beliefs = Array.isArray(answer.beliefs) ? answer.beliefs : [];
    const questions = Array.isArray(answer.questions) ? answer.questions : [];
    return {
      problems,
      texts: [answer.profile, answer.conclusion, ...beliefs.map((item) => item.text)],
      sample: [
        `conclusion: ${answer.conclusion}`,
        `beliefs: ${beliefs.map((item) => `${item.op} ${item.kind ?? ""} «${item.text ?? ""}»`).join("; ") || "none"}`,
        `question: ${questions[0]?.text ?? "none"}`,
      ],
    };
  }
  // /translate: one text back for every text sent, in the same order.
  const texts = Array.isArray(answer.texts) ? answer.texts : [];
  const problems =
    texts.length === body.texts.length &&
    texts.every((item) => typeof item === "string" && item.trim())
      ? []
      : [`sent ${body.texts.length} texts, got ${texts.length} usable`];
  return {
    problems,
    texts,
    sample: texts.slice(0, 2).map((item, at) => `${body.texts[at]} → ${item}`),
  };
}

const rows = [];
const details = [];
for (const request of readJson("smoke.json")) {
  const started = performance.now();
  let status = 0;
  let answer = {};
  try {
    const response = await fetch(base + request.path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Install-Id": "smoke-check",
        ...(process.env.AI_TOKEN ? { "X-App-Token": process.env.AI_TOKEN } : {}),
      },
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(150_000),
    });
    status = response.status;
    answer = await response.json().catch(() => ({}));
  } catch (error) {
    answer = {
      error: error.name === "TimeoutError" ? "no answer in 150 s" : String(error.message),
    };
  }
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const result =
    status === 200
      ? read(request.path, request.body, answer)
      : {
          problems: [`HTTP ${status || "—"}: ${ERRORS[status] ?? answer.error ?? "no answer"}`],
          texts: [],
          sample: [],
        };
  if (
    status === 200 &&
    !result.problems.length &&
    !inLanguage(result.texts, request.body.language)
  ) {
    result.problems.push(`not in ${request.body.language === "ru" ? "Russian" : "English"}`);
  }
  const ok = result.problems.length === 0;
  rows.push(
    `| ${ok ? "✅" : "❌"} | ${request.name} | ${seconds} s | ${ok ? "" : result.problems.join("; ")} |`,
  );
  details.push(`**${request.name}**`, "", ...result.sample.map((line) => `- ${line}`), "");
  console.log(
    `${ok ? "OK  " : "FAIL"} ${request.name} (${seconds} s) ${result.problems.join("; ")}`,
  );
}

const failed = rows.filter((row) => row.startsWith("| ❌")).length;
const report = [
  `## AI server check: ${failed ? `${failed} of ${rows.length} failed` : "everything works"}`,
  "",
  "| | Request | Time | Problem |",
  "|---|---|---|---|",
  ...rows,
  "",
  "### What the AI answered",
  "",
  ...details,
].join("\n");
console.log(`\n${report}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
process.exit(failed ? 1 : 0);
