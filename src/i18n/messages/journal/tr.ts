import type { Messages } from "./ru";

const WEEKDAY_PHRASES = [
  "pazartesileri",
  "salıları",
  "çarşambaları",
  "perşembeleri",
  "cumaları",
  "cumartesileri",
  "pazarları",
] as const;

export const tr: Messages = {
  title: "Günlük",
  intro:
    "Bir kaçamağı 10 saniyede kaydedin — kendinizi suçlamadan. Koç ne olduğunu soracak ve zamanla neyin tekrarlandığını gösterecek.",
  deepAnalytics: "Derin analiz",
  locked: {
    title: "Akışın kazandığı saatler ve günler",
    text: "Saatlere ve günlere göre kaçamak grafikleri, ayrıca nerede dayanıp nerede dayanamadığınızın analizi.",
  },
  empty: {
    title: "Henüz kayıt yok",
    text: "Bu harika. Akış yine de kazanırsa burada işaretleyin; böylece örüntüleri görebilirsiniz.",
  },
  history: "Kaçamak geçmişi",
  entries: (count: number) => `${count} kayıt`,
  showMore: "Daha fazla göster",
  form: {
    label: "Kaçamak kaydet",
    statement: "Akış mı kazandı? Olur böyle şeyler.",
    where: "Nerede",
    howLong: "Ne kadar gitti",
    save: "Kaçamağı kaydet",
  },
  patterns: {
    label: "Örüntüler",
    addMore: (count: number) =>
      `${count} kayıt daha ekleyin; akışın en çok ne zaman ve neden kazandığını gösterelim.`,
    slipsWeek: "7 günde kaçamak",
    lostWeek: "7 günde kaybedilen",
    resisted: "Direnilen",
    percent: (percent: number) => `%${percent}`,
    riskyTime: "Riskli zaman",
    topApp: "Ana akış",
    summary: (time: string, reason: string) => `Kaçamaklar en çok ${time} ${reason} oluyor.`,
    detail: (hours: string, weekday: number) =>
      `En riskli saat: ${hours}. En çok ${WEEKDAY_PHRASES[weekday]} zorlanıyorsunuz.`,
    weekdayPhrases: WEEKDAY_PHRASES,
  },
  deep: {
    byHour: "Saatlere göre kaçamaklar",
    byWeekday: "Günlere göre kaçamaklar",
    noData: "Henüz veri yok",
    columnA11y: (label: string, count: number) => `${label}: ${count} kaçamak`,
    readout: (label: string, count: number) => `${label} · ${count} kaçamak`,
    triggers: "Nedenler: direnç ve kaçamak",
    resisted: "Direnilen",
    slips: "Kaçamak",
    triggersEmpty: "Nedeni SOS molasında ve günlükte işaretleyin — dağılım burada görünecek.",
    triggerA11y: (label: string, resisted: number, slips: number) =>
      `${label}: direnilen ${resisted}, kaçamak ${slips}`,
  },
  item: {
    noReason: "Neden belirtilmedi",
    delete: "Kaydı sil",
    reflectA11y: "Kaçamağı koçla konuş",
    reflect: "Konuş",
    confirm: "Bu kayıt silinsin mi?",
    cancel: "Vazgeç",
    confirmDelete: "Sil",
  },
  demoNote: "Yatmadan önce “bir dakikalığına” açtım",
};
