import type { Messages } from "./ru";

export const tr: Messages = {
  step: (current: number, total: number) => `Adım ${current}/${total}`,
  intro: "Bilişsel anti-scroll: akış sizi içine çekmeden dürtüyü yakalıyoruz.",
  promises: {
    sos: {
      title: "15 saniyelik SOS molası",
      text: "Dürtü geçene kadar nefes ve topraklanma.",
    },
    replacements: {
      title: "Mini alternatifler",
      text: "Akış yerine 1–3 dakikalık hareket, görev ya da ilginç bir bilgi.",
    },
    stats: {
      title: "Dürüst istatistik",
      text: "Kitaba, uykuya ve yürüyüşe ne kadar zaman kazandırdığınızı görün.",
    },
  },
  start: "Başla",
  demo: "Örnek verilerle göz at",
  baseline: {
    overline: "Dürüst bir başlangıç noktası",
    title: "Şu an akışa günde ne kadar zaman gidiyor?",
    text: "Yaklaşık olarak: hissinize göre ya da Ekran Süresi verilerine bakarak. Karşılaştırma için başlangıç seviyeniz bu olacak.",
    slider: "Şu an günde akışta geçen dakika",
    mainApp: "En çok nerede takılıp kalıyorsunuz?",
    next: "İleri",
  },
  goal: {
    overline: "Gerçekçi bir hedef",
    title: "Günde ne kadar akış sizin için makul?",
    text: "Her şeyi bir anda bırakmanız gerekmiyor. Limit içinde kalan her gün serinizi uzatır.",
    limit: "Günlük limit",
    session: "Akışta bir “oturum”",
    sessionHint: "Dürtüye karşı her zafer için sayılacak dakika",
    summary: (perDay: string, perWeek: string) =>
      `Hedef: günde ${perDay} daha az. Haftada ${perWeek} size geri dönecek.`,
    done: "Tamam",
    back: "Geri",
  },
};
