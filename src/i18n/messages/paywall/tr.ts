import type { Messages, PeriodUnit } from "./ru";

/** Turkish keeps the noun singular after a number: "7 gün", "2 hafta". */
const PERIODS: Record<PeriodUnit, string> = {
  DAY: "gün",
  WEEK: "hafta",
  MONTH: "ay",
  YEAR: "yıl",
};

export const tr: Messages = {
  close: "Kapat",
  title: "StopScroll Pro",
  activeTitle: "Pro etkin",
  thanks: "Uygulamayı desteklediğiniz için teşekkürler!",
  activeText: "Tüm egzersizler, alternatifler ve analizler açık.",
  done: "Tamam",
  plansFailed: "Planlar yüklenemedi.",
  retry: "Tekrar dene",
  tryTrial: (trial: string) => `${trial} dene`,
  subscribe: "Pro’ya geç",
  restore: "Satın alımları geri yükle",
  nothingToRestore: "Bu mağaza hesabında etkin satın alım bulunamadı.",
  renewal: (plan: string, price: string) =>
    `${price} tutarındaki “${plan}” aboneliğiniz, siz iptal edene kadar otomatik olarak yenilenir. Dilediğiniz zaman App Store veya Google Play ayarlarından iptal edebilirsiniz; bunu dönem bitmeden en az 24 saat önce yapmanız gerekir.`,
  table: {
    free: "Ücretsiz",
    pro: "Pro",
    yes: "var",
    no: "yok",
    row: (label: string, free: string, pro: string) => `${label}: ücretsiz — ${free}, Pro — ${pro}`,
  },
  rows: {
    sos: "SOS molası",
    exercises: "Mola egzersizleri",
    replacements: "Alternatifler",
    replacementsPro: (count: number) => `${count} + özel`,
    trend: "Gidişat",
    heatmap: "Isı haritası",
    converter: "Zaman dönüştürücü",
    patterns: "Örüntüler",
    days: (count: number) => `${count} gün`,
    weeks: (count: number) => `${count} hafta`,
  },
  headlines: {
    default: {
      title: "Zamanınızı algoritmalardan geri alın",
      text: "Tüm egzersizler, alternatiflerin tam kataloğu, kendi alışkanlıklarınız ve derinlemesine analiz.",
    },
    exercises: {
      title: "SOS molası için tüm egzersizler",
      text: "Kutu nefesi, 100’den geriye sayma ve dürüst sorular: farklı dürtülere farklı anahtarlar.",
    },
    replacements: {
      title: "Mini alternatiflerin tam kataloğu",
      text: "Daha fazla hareket, zihin için görevler ve kısa bilgiler: her an için sağlıklı dopamin.",
    },
    custom: {
      title: "Kendi alternatifleriniz ve alışkanlıklarınız",
      text: "Size gerçekten iyi geleni ekleyin: gitar, şınav, bir sayfa kitap.",
    },
    analytics: {
      title: "Derinlemesine örüntü analizi",
      text: "Akışın en çok hangi saatte ve haftanın hangi gününde kazandığını öğrenin, önceden hazırlıklı olun.",
    },
    history: {
      title: "İlerlemenizin tüm geçmişi",
      text: "30 günlük gidişat ve 16 haftalık ısı haritası: alışkanlığın nasıl değiştiğini görün.",
    },
    converter: {
      title: "Zaman dönüştürücünün tamamı",
      text: "Akıştan geri kazandığınız antrenmanlar, dil dersleri ve sevdiklerinizle sohbetler.",
    },
  },
  plans: {
    annual: "Yıllık",
    sixMonths: "6 aylık",
    threeMonths: "3 aylık",
    twoMonths: "2 aylık",
    monthly: "Aylık",
    weekly: "Haftalık",
    lifetime: "Ömür boyu",
    trial: (count: number, unit: PeriodUnit) => `${count} ${PERIODS[unit]} ücretsiz`,
    oneTime: "tek seferlik satın alım",
    pricePerMonth: (price: string) => `aylık ≈ ${price}`,
    perMonth: "aylık",
    perWeek: "haftalık",
    savings: (percent: number) => `−%${percent}`,
  },
  unavailable: {
    demoTitle: "Bu bir demo sürümü: ödeme kapalı",
    devTitle: "Bu sürümde satın alımlar bağlı değil",
    title: "Satın alımlar geçici olarak kullanılamıyor",
    demoText:
      "App Store ve Google Play’deki uygulamada planlar burada görünür. Pro özelliklerine göz atmak için Test Pro’yu açın.",
    devText:
      "RevenueCat anahtarlarını .env.local dosyasına ekleyin (bkz. .env.example) ve sürümü yeniden başlatın; planlar burada otomatik olarak görünür.",
    text: "Mağazaya bağlanılamadı. Daha sonra tekrar deneyin; tüm ücretsiz özellikler çalışmaya devam ediyor.",
    testProOff: "Test Pro’yu kapat",
    testProOn: "Test için Pro’yu aç",
  },
  errors: {
    network: "Mağazaya bağlanılamıyor. İnternet bağlantınızı kontrol edip tekrar deneyin.",
    alreadyPurchased: "Bu abonelik zaten etkin. “Satın alımları geri yükle” düğmesine dokunun.",
    notAllowed: "Bu cihazda veya bu hesapta satın alma yapılamıyor.",
    pending: "Ödeme onay bekliyor. Onaylandığında Pro otomatik olarak açılacak.",
    planUnavailable: "Bu plan şu anda mağazanızda kullanılamıyor.",
    generic: "Satın alma tamamlanamadı. Biraz sonra tekrar deneyin.",
    noPlans: "Planlar henüz yayınlanmadı. Biraz sonra tekrar bakın.",
    notActivated:
      "Ödeme alındı ama Pro henüz etkin değil. “Satın alımları geri yükle” seçeneğini deneyin.",
  },
};
