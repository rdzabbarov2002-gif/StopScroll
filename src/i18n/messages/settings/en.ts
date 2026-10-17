import type { Messages } from "./ru";

export const en: Messages = {
  back: "Today",
  title: "Settings",
  pro: {
    title: "StopScroll Pro",
    active: "StopScroll Pro is active",
    open: "Open StopScroll Pro",
    activeText: "All exercises, alternatives, and in-depth analytics are unlocked.",
    pitch: "All exercises, your own alternatives, and in-depth analytics",
    restore: "Restore Purchases",
    restored: "Pro restored.",
    nothingToRestore: "No active purchases found.",
  },
  appearance: "Appearance",
  goals: {
    header: "Goals",
    limit: "Daily feed limit",
    limitHint: "A day within the limit keeps your streak going",
    session: "One feed session",
    sessionHint: "Minutes we count for each win",
    baseline: "Starting point",
    baselineHint: "Your daily feed time before StopScroll",
  },
  coach: {
    header: "Coach & Reports",
    footer: (time: string) =>
      `On Sundays at ${time}, the coach reviews your week and lets you know the report is ready.`,
    footerWithPhrasing: (time: string) =>
      `On Sundays at ${time}, the coach reviews your week and sends you a notification. Natural phrasing: ChatGPT rewrites the coach’s takeaways (without your notes or entries) — facts and numbers stay the same. Works when AI analysis is allowed.`,
    report: "Sunday report",
    reportSwitch: "Notify me about the weekly report",
    phrasing: "Natural phrasing",
    phrasingSwitch: "Natural phrasing for coach tips",
    notificationsWeb: "Notifications work in the iPhone and Android app.",
    notificationsDenied:
      "Allow notifications for StopScroll in your phone’s settings to get the report.",
  },
  ai: {
    header: "AI Coach",
    offFooter: "AI analysis isn’t connected in this build: your entries stay on your phone.",
    offValue: "Not connected",
    footer:
      "Entries, answers, and habit stats are sent to OpenAI (ChatGPT) through the StopScroll server only with your permission. The coach’s memory is stored on your phone.",
    consent: "Analysis in ChatGPT",
    consentSwitch: "Allow ChatGPT to analyze entries",
    confirmErase: "Erase entries and coach memory?",
    erase: "Delete AI Coach Data",
  },
  feed: "Main feed",
  dev: {
    demo: "Demo version",
    development: "Development",
    demoText:
      "This is the browser preview: payments are turned off. Fill the app with sample data to see charts, streaks, and patterns.",
    demoFill: "Fill with sample data",
    testPro: "Test Pro",
    testProDemo: "Unlocks Pro features without a purchase so you can try them.",
    testProDev: "Dev builds only: unlocks Pro features without a purchase.",
  },
  data: {
    header: "Data",
    text: "All records are stored only on this device. Resetting deletes your time history, wins, slips, your own alternatives, urge entries, and the AI coach’s memory, but keeps your goals and subscription.",
    reset: "Reset Progress",
  },
  cancel: "Cancel",
  erase: "Erase",
};
