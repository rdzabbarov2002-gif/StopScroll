import { useEffect, useState } from "react";
import { AppState } from "react-native";

/** Current time that re-renders the caller every `intervalMs` and when the app is reopened. */
export function useNow(intervalMs: number = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, intervalMs);
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}
