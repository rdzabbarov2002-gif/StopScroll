import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { ReplacementCategory, TriggerId } from "../utils/types";

/** What the user tried to open when the paywall appeared — tailors its headline. */
export type ProFeature =
  | "exercises"
  | "replacements"
  | "custom"
  | "analytics"
  | "history"
  | "converter";

export type RootTabParamList = {
  Home: undefined;
  /** The AI coach's analytics: forecast, patterns, hypotheses, experiments. */
  AI: undefined;
  Replacements: { category?: ReplacementCategory } | undefined;
  Stats: undefined;
  /** `handoffAt` makes every hand-over from the SOS screen re-prefill the form. */
  Journal: { trigger?: TriggerId; handoffAt?: number } | undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<RootTabParamList> | undefined;
  /** The 15-second SOS pause. */
  Intercept: { trigger?: TriggerId } | undefined;
  Replacement: { id: string; trigger?: TriggerId };
  Paywall: { feature?: ProFeature } | undefined;
  Settings: undefined;
  /** In-app privacy policy, used when no hosted policy URL is configured. */
  Privacy: undefined;
  /** `week` is a Monday key; the newest ready report by default. */
  WeeklyReport: { week?: string } | undefined;
  Achievements: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type RootTabScreenProps<T extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
