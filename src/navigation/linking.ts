import { createNavigationContainerRef, type LinkingOptions } from "@react-navigation/native";
import { Linking } from "react-native";

import { getLaunchNotificationUrl, subscribeToNotificationUrls } from "../services/reportReminder";
import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** stopscroll:// links: widget taps, the SOS pause and the Sunday report notification. */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["stopscroll://"],
  config: {
    initialRouteName: "Main",
    screens: {
      Main: {
        screens: {
          Home: "home",
          AI: "ai",
          Replacements: "replacements",
          Stats: "stats",
          Journal: "journal",
        },
      },
      Intercept: "pause",
      Replacement: "replacement/:id",
      WeeklyReport: "report",
      Achievements: "achievements",
      Settings: "settings",
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return url ?? getLaunchNotificationUrl();
  },
  subscribe(listener) {
    const links = Linking.addEventListener("url", ({ url }) => listener(url));
    const stopNotifications = subscribeToNotificationUrls(listener);
    return () => {
      links.remove();
      stopNotifications();
    };
  },
};
