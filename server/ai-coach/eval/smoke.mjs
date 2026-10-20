// A check of the deployed server with the requests the app itself sends: every route answers, the
// app's own code can read the answer, and the answer is in the requested language. Prints what the
// AI answered, for reading by a person.
//   smoke.json — 6 requests taken from the app's end-to-end test, a few cents;
//   smoke-extended.json — 47 situations (entries, deep analyses with and without memory,
//   translations) built with the app's own payload code, about half a dollar.
//
//   node --no-warnings --import ./eval/ts-hooks.mjs eval/smoke.mjs https://<worker>.workers.dev [set]
//   optional: AI_TOKEN=<the APP_TOKEN secret, if the server has one>
import { appendFileSync } from "node:fs";

import { parseEntryResult } from "../../../src/ai/parse.ts";
import { readJson } from "./lib.mjs";

const base = String(process.argv[2] ?? "")
  .trim()
  .replace(/\/+$/, "");
if (!/^https?:\/\/\S+$/.test(base)) {
  console.error(
    "Usage: smoke.mjs https://<the server's address> [smoke.json | smoke-extended.json]",
  );
  process.exit(2);
}
const set = process.argv[3] || "smoke.json";
// Optional: only these request numbers, e.g. "37-47".
const [from, to] = String(process.argv[4] || "1-9999")
  .split("-")
  .map(Number);

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
const short = (value, size = 160) => {
  const text = String(value ?? "").replace(/\s+/g, " ");
  return text.length > size ? `${text.slice(0, size)}…` : text;
};

/** What the app takes from each answer: problems, the texts to check the language of, the details. */
function read(path, body, answer) {
  if (path === "/entry") {
    const problems = [];
    const texts = [];
    const details = [];
    for (const entry of body.entries) {
      const raw = answer.results?.find((item) => item?.n === entry.n);
      const parsed = parseEntryResult(raw, Date.now(), entry.text.length);
      details.push(`«${short(entry.text, 120)}»`);
      if (!parsed) {
        problems.push(`entry ${entry.n}: the app could not read the analysis`);
        continue;
      }
      const a = parsed.analysis;
      texts.push(a.cause, a.emotion, a.gist, a.explanation);
      details.push(
        `  → cause: ${a.cause ?? "—"} · emotion: ${a.emotion ?? "—"} · context: ${a.context ?? "—"} · behavior: ${a.behavior ?? "—"}`,
        `  → tags: ${a.tags.join(", ") || "—"} · enough: ${a.enough} · conf: ${a.conf}${a.missing ? ` · missing: ${a.missing}` : ""}`,
        `  → gist: ${a.gist}`,
        ...(a.explanation ? [`  → insight: ${short(a.explanation, 300)}`] : []),
        ...(parsed.votes.length
          ? [`  → votes: ${parsed.votes.map((vote) => `${vote.id} ${vote.effect}`).join(", ")}`]
          : []),
      );
    }
    return { problems, texts, details };
  }
  if (path === "/deep") {
    const problems = [];
    if (!answer.profile || !answer.conclusion) problems.push("no profile or conclusion");
    const beliefs = Array.isArray(answer.beliefs) ? answer.beliefs : [];
    const questions = Array.isArray(answer.questions) ? answer.questions : [];
    const rereads = Array.isArray(answer.rereads) ? answer.rereads : [];
    const list = (title, items) =>
      Array.isArray(items) && items.length
        ? [
            `${title}: ${items.map((item) => short(typeof item === "string" ? item : `${item.title}: ${item.note}`, 120)).join(" | ")}`,
          ]
        : [];
    return {
      problems,
      texts: [
        answer.profile,
        answer.conclusion,
        ...beliefs.map((item) => item.text),
        ...questions.map((item) => item.text),
      ],
      details: [
        `profile: ${short(answer.profile, 400)}`,
        `conclusion: ${short(answer.conclusion, 400)}`,
        ...beliefs.map(
          (item) =>
            `belief: ${item.op} ${item.kind ?? ""} ${item.id ?? ""} «${short(item.text ?? "", 120)}»${item.cites?.length ? ` cites ${item.cites.join(",")}` : ""}${item.why ? ` — ${short(item.why, 160)}` : ""}`,
        ),
        ...rereads.map(
          (item) =>
            `reread: ${item.ref} ${item.verdict} (${item.cause ?? "—"}) — ${short(item.why, 160)}`,
        ),
        ...questions.map(
          (item) =>
            `question (${item.kind}${item.about ? `, about ${item.about}` : ""}): ${item.text}${item.options?.length ? ` [${item.options.join(" / ")}]` : ""}`,
        ),
        ...(answer.challenge
          ? [
              `experiment: ${answer.challenge.title} — ${short(answer.challenge.description, 200)} (${answer.challenge.durationDays} d, ${answer.challenge.focus})`,
            ]
          : []),
        ...(answer.chapter
          ? [`chapter ${answer.chapter.month}: ${short(answer.chapter.note, 200)}`]
          : []),
        ...(Array.isArray(answer.corrections)
          ? answer.corrections.map(
              (item) => `correction: ${item.was} → ${item.now} — ${short(item.why, 120)}`,
            )
          : []),
        ...list("emotions", answer.emotions),
        ...list("improvements", answer.improvements),
        ...list("worsenings", answer.worsenings),
        ...list("changes", answer.changes),
        ...(Array.isArray(answer.events)
          ? answer.events.map((item) => `event ${item.date}: ${short(item.note, 120)}`)
          : []),
      ],
    };
  }
  // /translate: one text back for every text sent, in the same order.
  const texts = Array.isArray(answer.texts) ? answer.texts : [];
  const empty = texts.flatMap((item, at) =>
    typeof item === "string" && item.trim() ? [] : [at + 1],
  );
  const problems =
    texts.length === body.texts.length && !empty.length
      ? []
      : [
          `sent ${body.texts.length} texts, got ${texts.length}${empty.length ? `, empty: #${empty.join(", #")}` : ""}`,
        ];
  return {
    problems,
    texts,
    details: texts
      .slice(0, 12)
      .map((item, at) => `${short(body.texts[at], 90)} → ${short(item, 90)}`),
  };
}

const requests = readJson(set);
const rows = [];
const details = [];
for (const [index, request] of requests.entries()) {
  if (index + 1 < from || index + 1 > (to || from)) continue;
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
          details: [],
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
    `| ${ok ? "✅" : "❌"} | ${index + 1}. ${request.name} | ${seconds} s | ${ok ? "" : result.problems.join("; ")} |`,
  );
  details.push(
    `**${index + 1}. ${request.name}**`,
    "",
    ...result.details.map((line) => `- ${line}`),
    "",
  );
  console.log(
    `${ok ? "OK  " : "FAIL"} ${index + 1}. ${request.name} (${seconds} s) ${result.problems.join("; ")}`,
  );
}

const failed = rows.filter((row) => row.startsWith("| ❌")).length;
const report = [
  `## AI server check (${set}): ${failed ? `${failed} of ${rows.length} failed` : `all ${rows.length} work`}`,
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
// Not process.exit(): it would cut the report while stdout is still being written.
process.exitCode = failed ? 1 : 0;
