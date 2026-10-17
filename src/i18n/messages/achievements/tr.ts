import type { PluralForms } from "../../plural";
import type { Messages } from "./ru";

export const tr: Messages = {
  title: "Başarılar",
  back: "Geri",
  earned: "Kazanılan",
  ofTotal: (total: number) => `/ ${total}`,
  closest: (title: string, progress: string) => `En yakın: “${title}” — ${progress}.`,
  allEarned: "Tüm başarıları topladınız. Artık akış size hükmetmiyor.",
  earnedCount: (count: number) => `${count} başarı`,
  ahead: "Sırada",
  earnedOn: (date: string) => `Kazanıldı: ${date}`,
  howToEarn: "Nasıl kazanılır",

  progress: {
    minutes: (current: string, target: string) => `${current} / ${target}`,
    // Turkish keeps the noun singular after a number.
    count: (current: number, target: number, unit: PluralForms) =>
      `${current}/${target} ${unit.other}`,
    once: "Henüz kazanılmadı",
    onceInline: "henüz kazanılmadı",
  },

  units: {
    times: { one: "kez", other: "kez" },
    days: { one: "gün", other: "gün" },
    nights: { one: "gece", other: "gece" },
    replacements: { one: "alternatif", other: "alternatif" },
    refusals: { one: "ret", other: "ret" },
  },

  unlock: {
    overline: "Yeni başarı",
    close: "Harika",
    openAll: "Tüm başarılar",
  },

  items: {
    "first-choice": {
      title: "Kendiniz için ilk seçim",
      description: "Dürtü sizi akışa çekti, ama siz molayı seçtiniz. Her şey böyle başlar.",
      hint: "Akış yerine bir mola verin ya da bir alternatif seçin.",
    },
    "first-evening": {
      title: "Akış olmadan ilk akşam",
      description: "Dayandığınız ve akışa bir kez bile kapılmadığınız bir akşam.",
      hint: "Akşam (17.00–23.00) akışa direnin ve akşamı kaçamak yapmadan bitirin.",
    },
    "first-hour": {
      title: "Kurtarılan ilk saat",
      description: "Algoritmaya değil, size kalan 60 dakika.",
      hint: "Molalar ve alternatiflerle 60 dakika kurtarın.",
    },
    "morning-free": {
      title: "Sabah sizin",
      description: "Sonsuz kaydırmayla değil, bir molayla başlayan bir sabah.",
      hint: "Sabah (05.00–12.00) akışa direnin ve öğlene kadar kaçamak yapmayın.",
    },
    comeback: {
      title: "Kaçamak yaptınız — ve döndünüz",
      description: "Bir kaçamak pes etmek için sebep olmadı: sonraki dürtüyü siz yendiniz.",
      hint: "Kaydedilen bir kaçamaktan sonraki 24 saat içinde bir dürtüye direnin.",
    },
    "honest-look": {
      title: "Beş dürüst değerlendirme",
      description:
        "Beş kez, bir kaçamaktan sonra kendinizi suçlamak yerine olanlar üzerine sakin bir konuşma.",
      hint: "Beş kaçamaktan sonra koçun “Ne oldu?” sorusunu yanıtlayın.",
    },
    "sunday-evening": {
      title: "Pazar akşamı sizin",
      description: "Haftanın akışa en çok kapılınan akşamı tek bir kaçamak olmadan geçti.",
      hint: "Pazar akşamı akışa direnin ve akşamı kaçamak yapmadan bitirin.",
    },
    "week-in-limit": {
      title: "Kendi ritminizde bir hafta",
      description: "Üst üste yedi gün limit içinde. Artık tempoyu akış belirlemiyor.",
      hint: "Üst üste 7 gün günlük limitinizin içinde kalın.",
    },
    "nights-7": {
      title: "Gece kaydırması olmadan 7 akşam",
      description: "Uykunun akıştan daha önemli olduğu yedi gece.",
      hint: "StopScroll kullandığınız günlerde 7 geceyi (22.00–05.00) kaçamak yapmadan geçirin.",
    },
    "stress-10": {
      title: "Kaçmadan stresle yüzleşmek",
      description: "Stresle 10 kez akışa sığınmadan yüzleştiniz. Dayanıklılık tam olarak bu.",
      hint: "Stres sizi akışa çektiğinde 10 kez direnin.",
    },
    "boredom-20": {
      title: "Can sıkıntısına karşı 20 zafer",
      description: "Can sıkıntısı sizi yirmi kez akışa çağırdı — ve yirmi kez kaybetti.",
      hint: "Can sıkıntısı sizi akışa çektiğinde 20 kez direnin.",
    },
    "replacements-25": {
      title: "Akış yerine beden ve zihin",
      description: "25 kez kaydırmak yerine hareketi, bir görevi ya da bir bilgiyi seçtiniz.",
      hint: "25 faydalı alternatif tamamlayın.",
    },
    "refusals-30": {
      title: "Üst üste 30 başarılı ret",
      description: "Üst üste otuz dürtü — ve aralarında tek bir kaçamak bile yok.",
      hint: "Kaçamak yapmadan üst üste 30 kez direnin.",
    },
    "half-feed": {
      title: "Yarı yarıya daha az akış",
      description: "Akışın StopScroll öncesine göre yarı yarıya daha az zaman aldığı bir hafta.",
      hint: "7 gün boyunca sürenizi kaydedin: ortalama, başlangıç seviyenizin yarısını geçmesin.",
    },
    "day-of-life": {
      title: "Hayatınızdan koca bir gün",
      description: "1.440 dakika kurtarıldı. Kendinize geri kazandırdığınız koca bir gün.",
      hint: "Molalar ve alternatiflerle 24 saat kurtarın.",
    },
  },

  firstEveningWith: (app: string) => `${app} olmadan ilk akşam`,
};
