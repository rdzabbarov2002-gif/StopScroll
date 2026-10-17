import type { PluralForms } from "../../plural";
import type { Messages } from "./ru";

const DAYS: PluralForms = { one: "gün", other: "gün" };

export const tr: Messages = {
  settings: "Ayarlar",
  today: "Bugün",
  yesterday: "Dün",
  noEntry: "kayıt yok",
  dayValue: (day: string, value: string) => `${day}: ${value}`,
  feed: {
    a11y: "Akış süresi, istatistikleri aç",
    label: "Akış süresi",
    limitLine: (duration: string) => `limit ${duration}`,
    empty: "Bugün akışa ne kadar zaman gittiğini kaydedin.",
    withinLimit: (duration: string) => `Bugün akışta ${duration} — limit içinde.`,
    overLimit: (duration: string) => `Bugün akışta ${duration} — bu, limitin üzerinde.`,
    less: (percent: number) => `Bugün akışta dünden %${percent} daha az zaman geçirdiniz.`,
    more: (percent: number) => `Bugün akışta dünden %${percent} daha fazla zaman geçirdiniz.`,
    same: "Bugün akışta dün kadar zaman geçirdiniz.",
  },
  limit: {
    a11y: "Limit ve seri, istatistikleri aç",
    label: "Limit",
    streak: "Seri",
    record: "Rekor",
    days: DAYS,
    streakDays: (days: number) => `Art arda ${days} gündür limit içinde kalıyorsunuz.`,
    firstDay: "Limit içindeki ilk gün. Seri yarın devam edecek.",
    over: "Bugün limit aşıldı. Yarın yeni bir seri başlıyor.",
    start: (limit: string) => `Günde en fazla ${limit} — seriniz burada başlayacak.`,
    dayWithin: "limit içinde",
    dayOver: "limitin üzerinde",
  },
  saved: {
    a11y: "Kurtarılan zaman, istatistikleri aç",
    label: "Kurtarılan zaman",
    today: (duration: string, wins: number) =>
      `Bugün kendinize ${duration} geri kazandırdınız — dürtüye karşı ${wins} zafer.`,
    empty: "Her mola size zaman kazandırır. Akış sizi çektiğinde molaya dokunun.",
    total: "Toplam",
  },
  pick: {
    a11y: (title: string) => `Günün alternatifi: ${title}`,
    label: "Günün alternatifi",
    start: "Başla",
  },
  tiles: {
    a11y: (label: string, title: string, caption: string) => `${label}: ${title}, ${caption}`,
    report: "Rapor",
    newReport: "Yeni rapor",
    sunday: "Pazar günü",
    reportSaved: (duration: string) => `Kurtarılan: ${duration}`,
    reportPromise: "Koç haftanızı değerlendirecek",
    achievements: "Başarılar",
    achievementsCount: (earned: number, total: number) => `${earned}/${total}`,
    firstAchievement: "İlki, ilk molanızdan sonra",
  },
};
