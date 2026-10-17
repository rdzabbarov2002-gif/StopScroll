import type { PluralForms } from "../../plural";
import type { Messages } from "./ru";

// Turkish keeps the noun singular after a number, so one form serves every count.
const DAYS: PluralForms = { one: "gün", other: "gün" };
const WINS: PluralForms = { one: "zafer", other: "zafer" };
const SLIPS: PluralForms = { one: "kaçamak", other: "kaçamak" };
const ALTERNATIVES: PluralForms = { one: "alternatif", other: "alternatif" };

export const tr: Messages = {
  title: "Hafta",
  back: "Geri",
  olderWeek: "Önceki hafta",
  newerWeek: "Sonraki hafta",

  firstReport: {
    title: "İlk rapor pazar günü",
    text: "Her pazar akşamı kişisel koçunuz haftayı değerlendirir: neler iyi gitti, akış nerede kazanıyor ve sırada ne denenebilir. Sürenizi ve kaçamaklarınızı kaydedin — değerlendirmenin dayanacağı bir şey olsun.",
  },
  quietWeek: {
    title: "Sakin bir hafta",
    text: "Bu günlerde hiç kayıt yok: ne dürtüye karşı zafer, ne kaçamak, ne de kaydedilmiş süre.",
  },

  daySaved: (day: string, duration: string) => `${day}: kurtarılan ${duration}`,
  dayScroll: (day: string, duration: string | null) =>
    `${day}: ${duration === null ? "kayıt yok" : duration}`,

  saved: {
    label: "Kurtarılan",
    change: (amount: string, more: boolean) =>
      `Önceki haftaya göre ${amount} daha ${more ? "fazla" : "az"}.`,
    total: (amount: string) => `Bu haftaki molalar ve alternatifler: hayatınızdan ${amount}.`,
    none: "Bu hafta henüz zaman kurtarılmadı — bir sonraki SOS molası bunu değiştirecek.",
    week: "Hafta boyunca",
    wins: "Zaferler",
  },

  metrics: {
    inLimit: "Limit içinde",
    ofDays: (logged: number) => `/ ${logged} gün`,
    slips: "Kaçamaklar",
    replacements: "Alternatifler",
    streak: "Seri",
    record: (days: number) => `Rekor: ${days} gün`,
    vsLastWeek: (delta: string) => `Geçen haftaya göre ${delta}`,
  },

  impulses: {
    label: "Dürtüler",
    none: "Bu hafta hiç dürtü olmadı.",
    success: (percent: number) => `Akış olmadan geçen dürtüler: %${percent}.`,
    breakdown: (total: number, wins: number, slips: number) =>
      `${total} dürtü: ${wins} zafer, ${slips} kaçamak.`,
    byTime: "Günün saatlerine göre",
    resisted: "Direnilen",
    slips: "Kaçamaklar",
    slot: (from: number, to: number, resisted: number, lost: number) =>
      `Saat ${from}.00–${to}.00: direnilen ${resisted}, kaçamak ${lost}`,
  },

  hardest: {
    header: "En zorlu anlar",
    noData: "Veri yok",
    day: "Riskli gün",
    hour: "Riskli saat",
    trigger: "En sık neden",
    slips: (count: number) => `${count} kaçamak`,
    mostFeed: (duration: string) => `En çok akış: ${duration}`,
    mostPull: (count: number) => `Akışa en çok çekilme · ${count} kez`,
    triggerSlips: (count: number, total: number) => `${count}/${total} kaçamak`,
    noSlips: "Kaçamak yok",
  },

  feed: {
    label: "Günlere göre akış",
    none: "Bu hafta akış süresi kaydedilmedi.",
    average: (average: string, inLimit: number, logged: number) =>
      `Günde ortalama ${average} · limit içinde: ${inLimit}/${logged} gün.`,
    limit: (duration: string) => `limit ${duration}`,
  },

  changes: {
    header: "Geçen haftayla karşılaştırma",
    saved: "Kurtarılan",
    slips: "Kaçamaklar",
    success: "Direnilen",
    scroll: "Günlük akış",
    same: "Değişiklik yok",
  },

  // The percent sign goes before the number in Turkish: "%80", "+%5".
  percent: (value: number, sign = "") => `${sign}%${value}`,

  units: {
    days: DAYS,
    wins: WINS,
    slips: SLIPS,
    replacements: ALTERNATIVES,
  },

  reminder: {
    channel: "Haftalık rapor",
    title: "Haftalık raporunuz hazır",
    body: "Ne kadar zamanı geri kazandığınız, en zor saatleriniz ve yeni başarılarınız.",
  },
};
