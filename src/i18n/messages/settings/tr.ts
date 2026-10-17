import type { Messages } from "./ru";

export const tr: Messages = {
  back: "Bugün",
  title: "Ayarlar",
  pro: {
    title: "StopScroll Pro",
    active: "StopScroll Pro etkin",
    open: "StopScroll Pro’yu aç",
    activeText: "Tüm egzersizler, alternatifler ve derinlemesine analiz açık.",
    pitch: "Tüm egzersizler, kendi alternatifleriniz ve derinlemesine analiz",
    restore: "Satın alımları geri yükle",
    restored: "Pro geri yüklendi.",
    nothingToRestore: "Etkin satın alım bulunamadı.",
  },
  appearance: "Görünüm",
  goals: {
    header: "Hedefler",
    limit: "Günlük akış limiti",
    limitHint: "Limit içinde geçen gün serinizi sürdürür",
    session: "Akışta bir oturum",
    sessionHint: "Her zafer için sayılan dakika",
    baseline: "Başlangıç seviyesi",
    baselineHint: "StopScroll’dan önce günde ne kadar gidiyordu",
  },
  coach: {
    header: "Koç ve raporlar",
    footer: (time: string) =>
      `Koç her pazar (saat ${time}) haftanızı değerlendirir ve rapor hazır olunca bildirim gönderir.`,
    footerWithPhrasing: (time: string) =>
      `Koç her pazar (saat ${time}) haftanızı değerlendirir ve bildirim gönderir. Doğal ifadeler: koçun çıkarımlarını (notlar ve kayıtlar olmadan) ChatGPT yeniden yazar; olgular ve rakamlar aynı kalır. AI analizine izin verildiyse çalışır.`,
    report: "Pazar raporu",
    reportSwitch: "Haftalık rapor için bildirim gönder",
    phrasing: "Doğal ifadeler",
    phrasingSwitch: "Koç önerileri için doğal ifadeler",
    notificationsWeb: "Bildirimler iPhone ve Android uygulamasında çalışır.",
    notificationsDenied:
      "Raporu almak için telefon ayarlarından StopScroll bildirimlerine izin verin.",
  },
  ai: {
    header: "AI koçu",
    offFooter: "Bu sürümde AI analizi bağlı değil: kayıtlar telefonda kalır.",
    offValue: "Bağlı değil",
    footer:
      "Kayıtlar, yanıtlar ve alışkanlık istatistikleri yalnızca izninizle, StopScroll sunucusu üzerinden OpenAI (ChatGPT) hizmetine gönderilir. Koçun hafızası telefonda saklanır.",
    consent: "ChatGPT ile analiz",
    consentSwitch: "Kayıtların ChatGPT ile analizine izin ver",
    confirmErase: "Kayıtlar ve koçun hafızası silinsin mi?",
    erase: "AI koçu verilerini sil",
  },
  feed: "Ana akış",
  dev: {
    demo: "Demo sürümü",
    development: "Geliştirme",
    demoText:
      "Bu, tarayıcıda göz atmak için bir sürüm: ödeme kapalı. Grafikleri, serileri ve örüntüleri görmek için uygulamayı örnek verilerle doldurun.",
    demoFill: "Örnek verilerle doldur",
    testPro: "Test Pro",
    testProDemo: "Pro özelliklerini satın almadan açar, böylece göz atabilirsiniz.",
    testProDev: "Yalnızca geliştirme sürümünde: Pro özelliklerini satın almadan açar.",
  },
  data: {
    header: "Veriler",
    text: "Tüm kayıtlar yalnızca bu cihazda saklanır. Sıfırlama; süre, zafer ve kaçamak geçmişini, kendi alternatiflerinizi, dürtü kayıtlarını ve AI koçunun hafızasını siler, ancak hedeflerinizi ve aboneliğinizi korur.",
    reset: "İlerlemeyi sıfırla",
  },
  cancel: "Vazgeç",
  erase: "Sil",
};
