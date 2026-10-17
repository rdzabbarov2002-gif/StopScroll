import type { Messages } from "./ru";

export const en: Messages = {
  title: "Privacy",
  close: "Close",
  links: {
    terms: "Terms of Use",
    privacy: "Privacy Policy",
  },
  sections: {
    stored: {
      title: "What’s stored",
      text: "Feed time, wins, slips and their causes, urge entries, the coach’s takeaways and memory, achievements, notes, your own alternatives, and settings are stored only on your device. We don’t create an account. Only what AI analysis needs is sent to the server, and only with your permission (see below).",
    },
    ai: {
      title: "AI Coach and ChatGPT",
      text: "AI analysis works only after you explicitly allow it. Then the texts of your entries (“what happened right before you wanted to open the feed”), your answers to the coach’s questions, habit stats (feed time, slips, wins, their times and weekdays), and the coach’s condensed memory are sent through the StopScroll server to OpenAI, where ChatGPT analyzes them. To refine its conclusions over time, the coach may resend a few earlier entries — no more than six at a time, and never deleted ones. If Natural phrasing is on, the coach’s ready-made on-device phrases are sent there too. Your name, email, contacts, and account data are not shared; the StopScroll server stores nothing, and requests to OpenAI are sent without storing the responses (store: false). Under OpenAI’s policies, data received through the API isn’t used to train models and may be kept for a limited time to prevent abuse. You can turn sending off in Settings → AI Coach.",
      offText:
        "AI analysis isn’t connected in this build: entries, the coach’s takeaways, and stats stay only on your device. The coach finds patterns, the day’s risk, and tips on its own, right on the device, without any servers.",
    },
    widgets: {
      title: "Widgets and notifications",
      text: "Widgets show numbers the app saves on your device. The report reminder is a local notification: it’s scheduled on your phone and doesn’t pass through our servers.",
    },
    purchases: {
      title: "Purchases",
      text: "Subscriptions are handled by the App Store or Google Play. RevenueCat checks your subscription status using an anonymous app identifier — without your name, email, or journal contents.",
    },
    ads: {
      title: "Ads and tracking",
      text: "The app has no ads and no third-party analytics, and we don’t track you across other apps or websites.",
    },
    deletion: {
      title: "Deleting your data",
      text: "You can reset your progress in Settings (this erases both your entries and the AI coach’s data); to erase only the entries and the AI coach’s memory, go to Settings → AI Coach. Deleting the app erases everything. You can manage your subscription in your store’s settings.",
    },
  },
};
