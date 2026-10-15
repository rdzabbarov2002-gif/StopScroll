/**
 * StopScroll AI coach — a Cloudflare Worker between the app and the OpenAI API.
 *
 * POST /entry     one entry the user wrote → its analysis (cause, emotion, context, behavior)
 * POST /insights  memory + new entries + arithmetic over the whole history
 *                 → updated memory, analytics, forecast, an occasional question, a weekly
 *                   experiment and its review
 * POST /forecast  memory summary + today's facts → today's risk forecast (cheaper refresh)
 * POST /phrase    the on-device coach's sentences → the same sentences, worded more naturally
 *
 * The OpenAI key lives only here, as a Worker secret. The server keeps nothing: the memory
 * and the history stay on the user's device and come with each request.
 */
import OpenAI from "openai";

import {
  ENTRY_INSTRUCTIONS,
  FORECAST_INSTRUCTIONS,
  INSIGHTS_INSTRUCTIONS,
  PHRASE_INSTRUCTIONS,
} from "./prompts";
import { ENTRY_SCHEMA, FORECAST_SCHEMA, INSIGHTS_SCHEMA, PHRASE_SCHEMA } from "./schemas";

/** Cloudflare's rate limiting binding (optional, see wrangler.toml). */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  OPENAI_API_KEY: string;
  /** Model id; a cost-efficient model with Structured Outputs support by default. */
  OPENAI_MODEL?: string;
  /** Reasoning effort for reasoning models ("none" | "minimal" | "low" | "medium" | "high"). */
  OPENAI_REASONING_EFFORT?: string;
  /** Optional shared value the app sends in X-App-Token; filters out casual traffic. */
  APP_TOKEN?: string;
  /** Optional CORS origin for the web build. */
  ALLOWED_ORIGIN?: string;
  /** Per client IP — the main limit (the client can't choose its IP). */
  RATE_LIMITER?: RateLimiter;
  /** Optional, stricter, per install id — on top of the IP limit, never instead of it. */
  INSTALL_RATE_LIMITER?: RateLimiter;
}

const DEFAULT_MODEL = "gpt-5.4-mini";

interface Route {
  instructions: string;
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
    instructions: ENTRY_INSTRUCTIONS,
    schema: ENTRY_SCHEMA,
    name: "entry_analysis",
    maxBodyBytes: 24_000,
    maxOutputTokens: 4_000,
    validate: (body) =>
      isRecord(body.entry) &&
      typeof body.entry.text === "string" &&
      body.entry.text.trim().length > 0,
  },
  "/insights": {
    instructions: INSIGHTS_INSTRUCTIONS,
    schema: INSIGHTS_SCHEMA,
    name: "habit_insights",
    maxBodyBytes: 160_000,
    maxOutputTokens: 16_000,
    validate: (body) => isRecord(body.facts) && Array.isArray(body.newEntries),
  },
  "/forecast": {
    instructions: FORECAST_INSTRUCTIONS,
    schema: FORECAST_SCHEMA,
    name: "risk_forecast",
    maxBodyBytes: 80_000,
    maxOutputTokens: 6_000,
    validate: (body) => isRecord(body.facts),
  },
  "/phrase": {
    instructions: PHRASE_INSTRUCTIONS,
    schema: PHRASE_SCHEMA,
    name: "phrasing",
    maxBodyBytes: 8_000,
    maxOutputTokens: 4_000,
    validate: (body) =>
      Array.isArray(body.texts) &&
      body.texts.length > 0 &&
      body.texts.length <= 12 &&
      body.texts.every((text) => typeof text === "string" && text.length <= 400),
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
): Promise<unknown> {
  const effort = env.OPENAI_REASONING_EFFORT ?? "low";
  const response = await client.responses.create({
    model: env.OPENAI_MODEL || DEFAULT_MODEL,
    instructions: route.instructions,
    input: JSON.stringify(payload),
    text: {
      format: { type: "json_schema", name: route.name, schema: route.schema, strict: true },
    },
    ...(effort === "off" ? {} : { reasoning: { effort: effort as "low" } }),
    max_output_tokens: route.maxOutputTokens,
    // Nothing is kept on OpenAI's side for later retrieval.
    store: false,
  });

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

  try {
    const result = await callModel(env, route, body, client);
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
