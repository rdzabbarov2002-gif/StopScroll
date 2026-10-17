import type { NavigationContainer, NavigationState } from "@react-navigation/native";
import type { ComponentProps } from "react";

import { navigationRef } from "./linking";

type RestoredState = ComponentProps<typeof NavigationContainer>["initialState"];

let remembered: RestoredState;

/**
 * Called right before the language changes: the app is re-created in the new language and
 * reopens where the user was, minus the language picker itself.
 */
export function rememberNavigation() {
  const state: NavigationState | undefined = navigationRef.isReady()
    ? navigationRef.getRootState()
    : undefined;
  if (!state) {
    remembered = undefined;
    return;
  }
  const routes = state.routes.filter((route) => route.name !== "Language");
  remembered = {
    ...state,
    routes,
    index: Math.min(state.index, routes.length - 1),
  } as unknown as RestoredState;
}

export const rememberedNavigation = () => remembered;
