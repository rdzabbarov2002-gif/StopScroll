// Runs every benchmark entry through /entry for each model configuration ("arm"), exactly as the
// app does: the Worker's own handle() (same instructions, schema, verbosity, limits, validation)
// with a real OpenAI client, then the app's own parseEntryResult(). Token usage and latency of
// every call are recorded. Resumable: calls already in outputs.jsonl are skipped.
//
//   node --no-warnings --import ./eval/ts-hooks.mjs eval/run.mjs --arms nano,mini --repeats 3
//   options: --name <results dir> --limit <entries> --concurrency <n> --mock (pipeline check only)
import OpenAI from "openai";

import { parseEntryResult } from "../../../src/ai/parse.ts";
import { handle } from "../src/index.ts";
import { ARMS, appendJsonl, args, pool, readJson, readJsonl, resultsDir, sleep } from "./lib.mjs";

const options = args({ arms: "nano,mini", repeats: "3", concurrency: "6", name: "main" });
const arms = String(options.arms).split(",");
for (const arm of arms) if (!ARMS[arm]) throw new Error(`unknown arm ${arm}`);
const entries = readJson("entries.json").slice(0, options.limit ? Number(options.limit) : undefined);
const memory = readJson("memory.json");
const EMPTY_MEMORY = { profile: null, zones: [], hypotheses: [], tags: [] };

if (!options.mock && !process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set (or run with --mock to check the pipeline only).");
  process.exit(1);
}
const name = options.mock ? `mock-${options.name}` : options.name;
const dir = resultsDir(name);
const outPath = `${dir}/outputs.jsonl`;
const done = new Set(
  readJsonl(outPath)
    .filter((row) => row.status === 200)
    .map((row) => `${row.arm}|${row.entryId}|${row.repeat}`),
);

// Pipeline check only: a fake model that echoes a fixed analysis. Never a result to report.
const mockClient = {
  responses: {
    create: async (request) => {
      const input = JSON.parse(request.input);
      const results = input.entries.map((entry) => ({
        n: entry.n,
        enough: entry.text.length > 12,
        cause: "MOCK",
        emotion: null,
        context: null,
        behavior: null,
        insight: null,
        missing: null,
        tags: ["mock"],
        gist: entry.text.slice(0, 60),
        votes: [],
      }));
      return {
        status: "completed",
        output: [{ type: "message", content: [{ type: "output_text" }] }],
        output_text: JSON.stringify({ results }),
        usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 0 }, output_tokens: 400, output_tokens_details: { reasoning_tokens: 270 } },
      };
    },
  },
};
const real = options.mock
  ? mockClient
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 2, timeout: 120_000 });

// The Worker logs a usage line per call; the benchmark records usage itself.
const log = console.log;
console.log = (...parts) => {
  if (typeof parts[0] === "string" && parts[0].startsWith('{"route"')) return;
  log(...parts);
};

async function callOnce(entry, arm, repeat) {
  const call = {};
  const client = {
    responses: {
      create: async (request) => {
        const started = performance.now();
        const response = await real.responses.create(request);
        call.latencyMs = Math.round(performance.now() - started);
        call.model = request.model;
        call.effort = request.reasoning?.effort ?? "off";
        call.responseStatus = response.status;
        call.usage = response.usage && {
          input: response.usage.input_tokens,
          cached: response.usage.input_tokens_details?.cached_tokens ?? 0,
          output: response.usage.output_tokens,
          reasoning: response.usage.output_tokens_details?.reasoning_tokens ?? 0,
        };
        call.rawText = response.output_text;
        return response;
      },
    },
  };
  const payload = {
    memory: entry.memory === "standard" ? memory : EMPTY_MEMORY,
    entries: [{ n: 1, when: entry.when, outcome: entry.outcome, text: entry.text }],
  };
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "mock",
    OPENAI_MODEL_LIGHT: ARMS[arm].model,
    OPENAI_EFFORT_LIGHT: ARMS[arm].effort,
  };
  const response = await handle(
    new Request("https://eval.local/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    env,
    client,
  );
  const body = await response.json();
  let parsed = null;
  if (response.status === 200) {
    const result = Array.isArray(body.results) ? body.results.find((item) => item?.n === 1) : null;
    parsed = parseEntryResult(result, 0);
  }
  return { status: response.status, error: response.status === 200 ? null : body.error, body, parsed, ...call };
}

const tasks = [];
for (const entry of entries) {
  for (const arm of arms) {
    for (let repeat = 0; repeat < Number(options.repeats); repeat += 1) {
      if (done.has(`${arm}|${entry.id}|${repeat}`)) continue;
      tasks.push(async () => {
        let attempt = 0;
        for (;;) {
          attempt += 1;
          const result = await callOnce(entry, arm, repeat).catch((error) => ({
            status: 0,
            error: String(error?.message ?? error),
          }));
          // Passing trouble is retried; an unusable answer (502) is a result in itself.
          if ([0, 429, 503, 504].includes(result.status) && attempt < 6) {
            await sleep(2000 * 2 ** attempt);
            continue;
          }
          appendJsonl(outPath, { entryId: entry.id, arm, repeat, attempt, ...result });
          return;
        }
      });
    }
  }
}

log(`${tasks.length} calls to make (${done.size} already done) → ${outPath}`);
await pool(tasks, Number(options.concurrency), (count, total) => {
  if (count % 20 === 0 || count === total) log(`${count}/${total}`);
});
log("done");
