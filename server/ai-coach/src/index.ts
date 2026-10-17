/**
 * StopScroll AI coach — a Cloudflare Worker between the app and the OpenAI API.
 *
 * POST /entry      new entries the user wrote (usually one) + a short digest of the memory
 *                  → their analysis, a one-line gist for the memory, votes on the beliefs
 *                  (a light, inexpensive model). The same route, with an empty memory, makes
 *                  the independent check of old readings before a deep analysis.
 * POST /deep       the memory + one-line digests of the new entries + a few original entries
 *                  chosen for re-reading + arithmetic over the whole history → operations on
 *                  the long-term memory, revised readings, questions, a weekly experiment
 *                  (rare: about once a week; a stronger model)
 * POST /phrase     the on-device coach's sentences → the same sentences, worded more naturally
 * POST /translate  the memory's texts → the same texts in the app's new language (once, after
 *                  the user changes the language)
 *
 * Every request carries `language` (ru, en, tr, de, fr): every text for the user comes back in
 * that language.
 *
 * Everything that is plain arithmetic — counts, streaks, records, percentages, the daily
 * forecast — is computed by the app and never costs a request.
 *
 * The OpenAI key lives only here, as a Worker secret. The server keeps nothing: the memory
 * and the history stay on the user's device.
 */
import OpenAI from "openai";

import {
  DEEP_INSTRUCTIONS,
  ENTRY_INSTRUCTIONS,
  PHRASE_INSTRUCTIONS,
  TRANSLATE_INSTRUCTIONS,
  isLanguage,
  languageBlock,
  type Language,
} from "./prompts";
import {
  DEEP_SCHEMA,
  ENTRY_SCHEMA,
  MAX_ENTRIES,
  MAX_TRANSLATE,
  PHRASE_SCHEMA,
  TRANSLATE_SCHEMA,
} from "./schemas";

/** Cloudflare's rate limiting binding (optional, see wrangler.toml). */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  OPENAI_API_KEY: string;
  /** Model for the frequent, simple requests (/entry, /phrase). */
  OPENAI_MODEL_LIGHT?: string;
  /** Model for the rare deep analysis (/deep). */
  OPENAI_MODEL_DEEP?: string;
  /** Reasoning effort per tier ("none" | "minimal" | "low" | "medium" | "high"; "off" — omit). */
  OPENAI_EFFORT_LIGHT?: string;
  OPENAI_EFFORT_DEEP?: string;
  /** Optional shared value the app sends in X-App-Token; filters out casual traffic. */
  APP_TOKEN?: string;
  /** Optional CORS origin for the web build. */
  ALLOWED_ORIGIN?: string;
  /** Per client IP — the main limit (the client can't choose its IP). */
  RATE_LIMITER?: RateLimiter;
  /** Optional, stricter, per install id — on top of the IP limit, never instead of it. */
  INSTALL_RATE_LIMITER?: RateLimiter;
}

type Tier = "light" | "deep";

/** Cost-efficient models with Structured Outputs support; both can be changed in wrangler.toml. */
const DEFAULTS: Record<Tier, { model: string; effort: string }> = {
  light: { model: "gpt-5.4-nano", effort: "low" },
  deep: { model: "gpt-5.4-mini", effort: "medium" },
};

interface Route {
  tier: Tier;
  instructions: string;
  /** How the texts address the user: the analysis formally, the on-device coach as a friend. */
  address: "formal" | "informal";
  schema: Record<string, unknown>;
  name: string;
  maxBodyBytes: number;
  maxOutputTokens: number;
  validate: (body: Record<string, unknown>) => boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const ROUTES: Record<string, Route> = {
  "/entry": {
    tier: "light",
    instructions: ENTRY_INSTRUCTIONS,
    address: "formal",
    schema: ENTRY_SCHEMA,
    name: "entry_analysis",
    maxBodyBytes: 40_000,
    maxOutputTokens: 6_000,
    validate: (body) =>
      Array.isArray(body.entries) &&
      body.entries.length > 0 &&
      body.entries.length <= MAX_ENTRIES &&
      body.entries.every(
        (entry) => isRecord(entry) && typeof entry.text === "string" && entry.text.trim() !== "",
      ),
  },
  "/deep": {
    tier: "deep",
    instructions: DEEP_INSTRUCTIONS,
    address: "formal",
    schema: DEEP_SCHEMA,
    name: "deep_analysis",
    maxBodyBytes: 96_000,
    // Reasoning tokens count here too; this is a ceiling, not what is usually spent.
    maxOutputTokens: 16_000,
    validate: (body) =>
      isRecord(body.stats) &&
      Array.isArray(body.newEntries) &&
      (body.reread === undefined || (Array.isArray(body.reread) && body.reread.length <= 8)),
  },
  "/phrase": {
    tier: "light",
    instructions: PHRASE_INSTRUCTIONS,
    address: "informal",
    schema: PHRASE_SCHEMA,
    name: "phrasing",
    maxBodyBytes: 8_000,
    maxOutputTokens: 3_000,
    validate: (body) =>
      Array.isArray(body.texts) &&
      body.texts.length > 0 &&
      body.texts.length <= 12 &&
      body.texts.every((text) => typeof text === "string" && text.length <= 400),
  },
  "/translate": {
    tier: "light",
    instructions: TRANSLATE_INSTRUCTIONS,
    address: "formal",
    schema: TRANSLATE_SCHEMA,
    name: "translation",
    maxBodyBytes: 48_000,
    maxOutputTokens: 12_000,
    validate: (body) =>
      Array.isArray(body.texts) &&
      body.texts.length > 0 &&
      body.texts.length <= MAX_TRANSLATE &&
      body.texts.every((text) => typeof text === "string" && text.length <= 900),
  },
};

function corsHeaders(env: Env): Record<string, string> {
  return env.ALLOWED_ORIGIN
    ? {
        "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-App-Token, X-Install-Id",
        "Access-Control-Max-Age": "86400",
      }
    : {};
}

const json = (env: Env, status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(env) },
  });

/** Thrown when the model's answer can't be used (declined, cut off or not valid JSON). */
class UnusableAnswer extends Error {}

/** One Structured Outputs request; returns the parsed JSON object. */
export async function callModel(
  env: Env,
  route: Route,
  payload: Record<string, unknown>,
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 1, timeout: 90_000 }),
  language: Language = "ru",
): Promise<unknown> {
  const tier = route.tier === "light" ? "LIGHT" : "DEEP";
  const model = env[`OPENAI_MODEL_${tier}`] || DEFAULTS[route.tier].model;
  const effort = env[`OPENAI_EFFORT_${tier}`] || DEFAULTS[route.tier].effort;
  const response = await client.responses.create({
    model,
    // The instructions and the schema come first and never change (the language goes last), so
    // OpenAI serves them from its prompt cache (cheaper input); the key keeps each kind of
    // request on its own cache, shared by every language.
    instructions: route.instructions + languageBlock(language, route.address),
    input: JSON.stringify(payload),
    text: {
      format: { type: "json_schema", name: route.name, schema: route.schema, strict: true },
      verbosity: "low",
    },
    ...(effort === "off" ? {} : { reasoning: { effort: effort as "low" } }),
    max_output_tokens: route.maxOutputTokens,
    prompt_cache_key: `stopscroll-${route.name}`,
    // Nothing is kept on OpenAI's side for later retrieval.
    store: false,
  });

  // Token usage per request, for watching the cost (no user data is logged).
  const usage = response.usage;
  if (usage) {
    console.log(
      JSON.stringify({
        route: route.name,
        language,
        model,
        input: usage.input_tokens,
        cached: usage.input_tokens_details?.cached_tokens ?? 0,
        output: usage.output_tokens,
        reasoning: usage.output_tokens_details?.reasoning_tokens ?? 0,
      }),
    );
  }

  if (response.status !== "completed") {
    throw new UnusableAnswer(`status ${response.status}: ${response.incomplete_details?.reason}`);
  }
  for (const item of response.output) {
    if (item.type === "message" && item.content.some((part) => part.type === "refusal")) {
      throw new UnusableAnswer("refused");
    }
  }
  try {
    return JSON.parse(response.output_text) as unknown;
  } catch {
    throw new UnusableAnswer("invalid json");
  }
}

export async function handle(request: Request, env: Env, client?: OpenAI): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(env) });
  const route = ROUTES[new URL(request.url).pathname];
  if (!route) return json(env, 404, { error: "not_found" });
  if (request.method !== "POST") return json(env, 405, { error: "method_not_allowed" });
  if (env.APP_TOKEN && request.headers.get("X-App-Token") !== env.APP_TOKEN) {
    return json(env, 401, { error: "unauthorized" });
  }
  if (env.RATE_LIMITER) {
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (!(await env.RATE_LIMITER.limit({ key: ip })).success) {
      return json(env, 429, { error: "rate_limited" });
    }
  }
  const installId = request.headers.get("X-Install-Id")?.slice(0, 64);
  if (env.INSTALL_RATE_LIMITER && installId) {
    if (!(await env.INSTALL_RATE_LIMITER.limit({ key: installId })).success) {
      return json(env, 429, { error: "rate_limited" });
    }
  }

  // The size is checked in bytes, before and while reading — a huge body is never buffered.
  const declared = Number(request.headers.get("Content-Length") ?? NaN);
  if (declared > route.maxBodyBytes) return json(env, 413, { error: "too_large" });
  const raw = await readLimited(request, route.maxBodyBytes);
  if (raw === null) return json(env, 413, { error: "too_large" });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  if (!isRecord(body) || !route.validate(body)) return json(env, 400, { error: "bad_request" });
  // The app's language; an older app without it gets Russian, as before.
  const { language, ...payload } = body;

  try {
    const result = await callModel(
      env,
      route,
      payload,
      client,
      isLanguage(language) ? language : "ru",
    );
    return json(env, 200, result);
  } catch (error) {
    return errorResponse(env, route, error);
  }
}

/** Reads the body as text, or null as soon as it grows past `limit` bytes. */
async function readLimited(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Maps a failure to what the app can act on: 502 — the answer was unusable (counts as an attempt),
 * 503/504/429 — passing trouble (the app waits and retries), 500 — the server is misconfigured.
 * Details go to the Worker log (never the key or the user's data).
 */
function errorResponse(env: Env, route: Route, error: unknown): Response {
  if (error instanceof UnusableAnswer) {
    console.error(route.name, "unusable answer:", error.message);
    return json(env, 502, { error: "unusable_answer" });
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    console.error(route.name, "timeout");
    return json(env, 504, { error: "upstream_timeout" });
  }
  if (error instanceof OpenAI.APIError) {
    console.error(route.name, "OpenAI error", error.status, error.code, error.type);
    if (error.code === "insufficient_quota") return json(env, 503, { error: "quota" });
    if (error.status === 429) return json(env, 429, { error: "upstream_busy" });
    if (error.status === undefined || error.status >= 500) {
      return json(env, 503, { error: "upstream_unavailable" });
    }
    // 400/401/403/404: a wrong key, model id or request — fix the configuration.
    return json(env, 500, { error: "configuration" });
  }
  console.error(route.name, "unexpected", error instanceof Error ? error.message : typeof error);
  return json(env, 503, { error: "upstream_unavailable" });
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
};
