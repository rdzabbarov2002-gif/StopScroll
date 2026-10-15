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
  RATE_LIMITER?: RateLimiter;
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
    const key =
      request.headers.get("X-Install-Id")?.slice(0, 64) ||
      request.headers.get("CF-Connecting-IP") ||
      "anonymous";
    const { success } = await env.RATE_LIMITER.limit({ key });
    if (!success) return json(env, 429, { error: "rate_limited" });
  }

  const raw = await request.text();
  if (raw.length > route.maxBodyBytes) return json(env, 413, { error: "too_large" });
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
    if (error instanceof UnusableAnswer) return json(env, 502, { error: "unusable_answer" });
    if (error instanceof OpenAI.RateLimitError) return json(env, 429, { error: "upstream_busy" });
    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      return json(env, 504, { error: "upstream_timeout" });
    }
    return json(env, 502, { error: "upstream" });
  }
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
};
