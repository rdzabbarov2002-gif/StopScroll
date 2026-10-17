import type { Messages } from "./ru";

// Turkish keeps the noun singular after a number ("5 gün", "3 zafer"), so no plural forms here.
export const tr: Messages = {
  empty: "Rakamlarınızın burada görünmesi için StopScroll’u açın.",
  today: {
    a11y: (saved: string) => `Bugün kurtarılan: ${saved}`,
    label: "Kurtarılan",
    caption: "Bugün",
    wins: (count: number) => `Akışa karşı ${count} zafer`,
    noWins: "Mola zaman kazandırır",
  },
  streak: {
    a11y: (days: number) => `Seri: ${days} gün`,
    label: "Seri",
    unit: () => "gün",
    active: "limit içinde",
    start: "Seriye bugün başlayın",
  },
  limit: {
    a11yUnlogged: "Limit: süre kaydedilmedi",
    a11yLeft: (left: string) => `Limit: kalan ${left}`,
    label: "Limit",
    today: "Bugün",
    left: "Kalan",
    over: "Limit aşımı",
    logPrompt: "Bugünkü sürenizi kaydedin",
    ofToday: (limit: string) => `Bugünkü limit: ${limit}`,
  },
  ring: {
    a11y: (used: string | null, limit: string) =>
      `Bugünkü akış: ${used ?? "kaydedilmedi"}, limit ${limit}`,
    of: (limit: string) => `/ ${limit}`,
    logPrompt: "Süreyi kaydedin",
    over: "Limit aşıldı",
    feedToday: "Bugünkü akış",
  },
  replacement: {
    a11y: (title: string) => `Akış yerine: ${title}`,
    label: "Akış yerine",
    caption: (duration: string) => `${duration} · her yarım saatte yeni`,
  },
};
