import AsyncStorage from "@react-native-async-storage/async-storage";

import { createId } from "../utils/persistedState";

/**
 * Talks to the app's own server (server/ai-coach), which calls the ChatGPT API. The OpenAI key
 * never ships in the app: anything inside a build, EXPO_PUBLIC_* included, can be extracted.
 */
const BASE_URL = process.env.EXPO_PUBLIC_AI_URL?.trim().replace(/\/+$/, "") || null;
const TOKEN = process.env.EXPO_PUBLIC_AI_TOKEN?.trim() || null;

export const AI_CONFIGURED = BASE_URL !== null;

const INSTALL_ID_KEY = "@stopscroll/ai/install-id";
let installId: Promise<string> | null = null;

/** A random id per install — only for the server's per-device rate limit. */
function getInstallId(): Promise<string> {
  installId ??= AsyncStorage.getItem(INSTALL_ID_KEY)
    .then(async (stored) => {
      if (stored) return stored;
      const fresh = createId();
      await AsyncStorage.setItem(INSTALL_ID_KEY, fresh).catch(() => undefined);
      return fresh;
    })
    .catch(() => createId());
  return installId;
}

export type AiErrorKind = "offline" | "timeout" | "busy" | "server" | "unusable";

export class AiRequestError extends Error {
  constructor(readonly kind: AiErrorKind) {
    super(kind);
  }
}

export async function postAi(path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  if (!BASE_URL) throw new AiRequestError("server");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(BASE_URL + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Install-Id": await getInstallId(),
        ...(TOKEN ? { "X-App-Token": TOKEN } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new AiRequestError(controller.signal.aborted ? "timeout" : "offline");
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) throw new AiRequestError("busy");
  if (response.status === 502 || response.status === 504) {
    throw new AiRequestError(response.status === 504 ? "timeout" : "unusable");
  }
  if (!response.ok) throw new AiRequestError("server");
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new AiRequestError("unusable");
  }
}

export const AI_ERROR_TEXT: Record<AiErrorKind, string> = {
  offline: "Нет соединения с интернетом. Анализ продолжится, когда сеть появится.",
  timeout: "ChatGPT отвечает слишком долго. Попробуем ещё раз чуть позже.",
  busy: "Сервис сейчас перегружен. Попробуем ещё раз через пару минут.",
  server: "Сервер AI-коуча недоступен. Попробуем ещё раз позже.",
  unusable: "Ответ ChatGPT не получилось разобрать. Попробуем ещё раз.",
};
