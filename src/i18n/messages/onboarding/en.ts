import type { Messages } from "./ru";

export const en: Messages = {
  step: (current: number, total: number) => `Step ${current} of ${total}`,
  intro: "Cognitive anti-scrolling: we catch the urge before the feed pulls you in.",
  promises: {
    sos: {
      title: "15-second SOS pause",
      text: "Breathing and grounding until the urge fades.",
    },
    replacements: {
      title: "Micro-alternatives",
      text: "1–3 minutes of movement, a task, or a fact instead of the feed.",
    },
    stats: {
      title: "Honest stats",
      text: "See how much time you’ve won back — for books, sleep, and walks.",
    },
  },
  start: "Get Started",
  demo: "Explore with sample data",
  baseline: {
    overline: "An honest starting point",
    title: "How much time do you spend in the feed each day?",
    text: "Roughly — by feel or from Screen Time. This is your baseline for comparison.",
    slider: "Daily minutes in the feed right now",
    mainApp: "Where do you get hooked most often?",
    next: "Next",
  },
  goal: {
    overline: "A realistic goal",
    title: "How much feed a day feels okay to you?",
    text: "No need to quit all at once. Every day within the limit extends your streak.",
    limit: "Daily limit",
    session: "One feed “session”",
    sessionHint: "Minutes we’ll count for each win over an urge",
    summary: (perDay: string, perWeek: string) =>
      `Goal: ${perDay} less per day. That’s ${perWeek} a week back in your life.`,
    done: "Done",
    back: "Back",
  },
};
