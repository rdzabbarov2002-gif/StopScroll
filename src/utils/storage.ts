import AsyncStorage from "@react-native-async-storage/async-storage";

import { createInitialState, sanitizePersistedState } from "./persistedState";
import type { PersistedState } from "./types";

export const STORAGE_KEY = "@stopscroll/state/v1";
const CORRUPT_BACKUP_KEY = `${STORAGE_KEY}:corrupt`;

export async function loadPersistedState(): Promise<PersistedState> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (json === null) return createInitialState();
  try {
    return sanitizePersistedState(JSON.parse(json));
  } catch (error) {
    // Keep the unreadable payload around so it can be inspected or recovered later.
    console.warn("StopScroll: stored state is corrupted, starting fresh", error);
    await AsyncStorage.setItem(CORRUPT_BACKUP_KEY, json).catch(() => undefined);
    return createInitialState();
  }
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
