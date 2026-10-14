import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useReducer } from "react";

import { tidy } from "../coach/language";
import { isFaithfulPhrasing } from "../coach/phrasing";
import { useApp } from "../context/AppContext";

/**
 * Optional "живые формулировки": the coach's sentences — already built from the user's records —
 * are sent to the app's own server (server/coach-voice), which only rewords them. The facts never
 * come from there: every reworded sentence is checked against the original and dropped if any
 * number, time or weekday differs. Notes and raw records are never sent.
 *
 * Off unless EXPO_PUBLIC_COACH_VOICE_URL is set at build time, and the user can switch it off.
 */
const ENDPOINT = process.env.EXPO_PUBLIC_COACH_VOICE_URL?.trim() || null;
const TOKEN = process.env.EXPO_PUBLIC_COACH_VOICE_TOKEN?.trim() || null;
export const COACH_VOICE_AVAILABLE = ENDPOINT !== null;

const CACHE_KEY = "stopscroll.coachVoice.v1";
const MAX_CACHE = 80;
const MAX_TEXTS = 12;
const TIMEOUT_MS = 10_000;

let cache: Map<string, string> | null = null;
let loading: Promise<Map<string, string>> | null = null;
/** Sentences already sent this session — each one is asked about at most once. */
const attempted = new Set<string>();

function loadCache(): Promise<Map<string, string>> {
  if (cache) return Promise.resolve(cache);
  loading ??= AsyncStorage.getItem(CACHE_KEY)
    .then((json) => {
      const parsed: unknown = json ? JSON.parse(json) : null;
      const entries =
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? Object.entries(parsed).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            )
          : [];
      cache = new Map(entries);
      return cache;
    })
    .catch(() => {
      cache = new Map();
      return cache;
    });
  return loading;
}

function saveCache(map: Map<string, string>) {
  while (map.size > MAX_CACHE) map.delete(map.keys().next().value!);
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(map))).catch(() => undefined);
}

async function requestPhrasing(texts: string[]): Promise<unknown[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(ENDPOINT!, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(TOKEN ? { "X-App-Token": TOKEN } : {}) },
      body: JSON.stringify({ texts }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const result =
      body && typeof body === "object" && "texts" in body
        ? (body as { texts: unknown }).texts
        : null;
    return Array.isArray(result) && result.length === texts.length ? result : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Rewords the sentences not yet in the cache; true when something new arrived. */
async function phrase(texts: readonly string[]): Promise<boolean> {
  const map = await loadCache();
  const missing = texts
    .filter((text) => !map.has(text) && !attempted.has(text))
    .slice(0, MAX_TEXTS);
  if (missing.length === 0) return false;
  missing.forEach((text) => attempted.add(text));
  const result = await requestPhrasing(missing);
  if (!result) return false;
  let changed = false;
  missing.forEach((text, index) => {
    const candidate = result[index];
    if (isFaithfulPhrasing(text, candidate)) {
      map.set(text, candidate.replace(/\s+/g, " ").trim());
      changed = true;
    }
  });
  if (changed) saveCache(map);
  return changed;
}

/**
 * The coach's sentences as the user should see them: reworded when that is switched on and a
 * faithful version is ready, otherwise as built (with non-breaking spaces). Never blocks rendering.
 */
export function useCoachVoice(texts: readonly string[]): readonly string[] {
  const { settings } = useApp();
  const enabled = COACH_VOICE_AVAILABLE && settings.coachPhrasing;
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const key = texts.join("\u0000");

  useEffect(() => {
    if (!enabled || texts.length === 0) return;
    let active = true;
    void phrase(texts).then((changed) => {
      if (active && changed) refresh();
    });
    if (!cache) void loadCache().then(() => active && refresh());
    return () => {
      active = false;
    };
    // `key` stands for `texts`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  if (!enabled || !cache) return texts.map(tidy);
  return texts.map((text) => tidy(cache!.get(text) ?? text));
}
