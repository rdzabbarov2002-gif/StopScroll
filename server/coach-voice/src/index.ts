/**
 * StopScroll coach voice — an optional Cloudflare Worker.
 *
 * The app finds patterns in the user's records itself and builds the coach's sentences from them.
 * This server only rewords those sentences so they read more naturally. It gets no records and no
 * notes, it is told not to add or change any fact, and the app checks every reworded sentence
 * against the original (numbers, times, weekdays) and keeps the original if anything differs.
 *
 * The Anthropic API key lives here, as a Worker secret, never in the app.
 */
import Anthropic from "@anthropic-ai/sdk";

interface Env {
  ANTHROPIC_API_KEY: string;
  /** Optional shared value the app sends in X-App-Token; filters out casual traffic. */
  APP_TOKEN?: string;
  /** Optional CORS origin for the web build, e.g. https://stopscroll.app. */
  ALLOWED_ORIGIN?: string;
}

const MODEL = "claude-opus-5-5";
const MAX_TEXTS = 12;
const MAX_CHARS = 400;

const SYSTEM = `Ты редактируешь реплики спокойного, дружелюбного тренера по цифровым привычкам в мобильном приложении.

Каждая реплика уже содержит вывод, найденный в данных пользователя. Твоя задача — только сделать формулировку живой и естественной, как у хорошего тренера.

Правила:
- Сохраняй смысл и все факты без изменений: числа (пиши их цифрами, как в исходной фразе), время, дни недели, причины, сравнения, названия приложений и упражнений.
- Не добавляй новых фактов, выводов, советов, цифр, обещаний или оценок. Если не уверен, что формулировка сохраняет факт, оставь фразу почти как есть.
- Обращайся на «ты» и не указывай пол: избегай глаголов прошедшего времени и прилагательных в мужском или женском роде, если их нет в исходной фразе.
- Тон спокойный и поддерживающий. Без восклицательных знаков, эмодзи, канцелярита, пафоса, чрезмерной мотивации, токсичного позитива и упрёков.
- Не упоминай технологии, приложения-помощники, искусственный интеллект, модели или себя.
- Длина — примерно как у исходной фразы.
- Верни столько же реплик и в том же порядке.`;

const SCHEMA = {
  type: "object",
  properties: { texts: { type: "array", items: { type: "string" } } },
  required: ["texts"],
  additionalProperties: false,
};

function corsHeaders(env: Env): Record<string, string> {
  return env.ALLOWED_ORIGIN
    ? {
        "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
        "Access-Control-Max-Age": "86400",
      }
    : {};
}

const json = (env: Env, status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(env) },
  });

function readTexts(body: unknown): string[] | null {
  if (!body || typeof body !== "object" || !("texts" in body)) return null;
  const { texts } = body as { texts: unknown };
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_TEXTS) return null;
  return texts.every((text) => typeof text === "string" && text.trim() && text.length <= MAX_CHARS)
    ? (texts as string[])
    : null;
}

async function rephrase(env: Env, texts: string[]): Promise<string[] | null> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify({ texts }) }],
  });
  // A declined or cut-off answer is not used: the app keeps its own wording.
  if (response.stop_reason !== "end_turn") return null;
  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") return null;
  const parsed = JSON.parse(text.text) as { texts?: unknown };
  return Array.isArray(parsed.texts) &&
    parsed.texts.length === texts.length &&
    parsed.texts.every((item) => typeof item === "string")
    ? (parsed.texts as string[])
    : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(env) });
    if (request.method !== "POST") return json(env, 405, { error: "method_not_allowed" });
    if (env.APP_TOKEN && request.headers.get("X-App-Token") !== env.APP_TOKEN) {
      return json(env, 401, { error: "unauthorized" });
    }
    if (Number(request.headers.get("Content-Length") ?? 0) > 8_000) {
      return json(env, 413, { error: "too_large" });
    }

    let texts: string[] | null;
    try {
      texts = readTexts(await request.json());
    } catch {
      texts = null;
    }
    if (!texts) return json(env, 400, { error: "bad_request" });

    try {
      const phrased = await rephrase(env, texts);
      return phrased
        ? json(env, 200, { texts: phrased })
        : json(env, 502, { error: "no_phrasing" });
    } catch (error) {
      const status = error instanceof Anthropic.RateLimitError ? 429 : 502;
      return json(env, status, { error: "upstream" });
    }
  },
};
