import AsyncStorage from "@react-native-async-storage/async-storage";

import { getLanguage, m } from "../i18n";
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

export type AiErrorKind = "offline" | "timeout" | "busy" | "unavailable" | "server" | "unusable";

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
      // Every answer — analysis, questions, forecasts, advice — comes in the app's language.
      body: JSON.stringify({ ...(body as object), language: getLanguage() }),
      signal: controller.signal,
    });
  } catch {
    throw new AiRequestError(controller.signal.aborted ? "timeout" : "offline");
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) throw new AiRequestError("busy");
  if (response.status === 504) throw new AiRequestError("timeout");
  if (response.status === 503) throw new AiRequestError("unavailable");
  if (response.status === 502) throw new AiRequestError("unusable");
  if (!response.ok) throw new AiRequestError("server");
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new AiRequestError("unusable");
  }
}

/** What to tell the user about a failed request, in the app's current language. */
export const aiErrorText = (kind: AiErrorKind) => m().ai.errors[kind];
