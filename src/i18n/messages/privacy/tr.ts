import type { Messages } from "./ru";

export const tr: Messages = {
  title: "Gizlilik",
  close: "Kapat",
  links: {
    terms: "Kullanım Koşulları",
    privacy: "Gizlilik Politikası",
  },
  sections: {
    stored: {
      title: "Neler saklanıyor",
      text: "Akışta geçen süre, zaferler, kaçamaklar ve nedenleri, dürtü kayıtları, koçun çıkarımları ve hafızası, başarılar, notlar, kendi alternatifleriniz ve ayarlar yalnızca cihazınızda saklanır. Hesap oluşturmuyoruz. Sunucuya yalnızca AI analizi için gerekenler ve yalnızca izninizle gönderilir (aşağıya bakın).",
    },
    ai: {
      title: "AI koçu ve ChatGPT",
      text: "AI analizi yalnızca açıkça izin verdikten sonra çalışır. Bu durumda kayıtlarınızın metinleri (“akışı açmak istemeden hemen önce ne oldu”), koçun sorularına verdiğiniz yanıtlar, alışkanlık istatistikleri (akışta geçen süre, kaçamaklar, zaferler, bunların saatleri ve haftanın günleri) ve koçun özetlenmiş hafızası StopScroll sunucusu üzerinden OpenAI hizmetine gönderilir ve orada ChatGPT tarafından analiz edilir. Koç, çıkarımlarını zamanla netleştirmek için önceki birkaç kaydı yeniden gönderebilir: bir seferde en fazla altı kayıt; silinmiş kayıtlar hiçbir zaman gönderilmez. “Doğal ifadeler” açıksa koçun cihazda hazırladığı cümleler de oraya gönderilir. Ad, e-posta, kişiler ve hesap verileri paylaşılmaz; StopScroll sunucusu hiçbir şey saklamaz, OpenAI hizmetine giden istekler de yanıtlar saklanmadan gönderilir (store: false). OpenAI kurallarına göre API üzerinden alınan veriler model eğitiminde kullanılmaz ve kötüye kullanımı önlemek için sınırlı bir süre saklanabilir. Gönderimi Ayarlar → AI koçu bölümünden kapatabilirsiniz.",
      offText:
        "Bu sürümde AI analizi bağlı değil: kayıtlar, koçun çıkarımları ve istatistikler yalnızca cihazınızda kalır. Koç örüntüleri, günün riskini ve önerileri sunuculara gerek kalmadan cihazda kendisi bulur.",
    },
    widgets: {
      title: "Widget’lar ve bildirimler",
      text: "Widget’lar, uygulamanın cihazda kaydettiği rakamları gösterir. Rapor hatırlatıcısı yerel bir bildirimdir: telefonda planlanır ve sunucularımızdan geçmez.",
    },
    purchases: {
      title: "Satın alımlar",
      text: "Abonelik App Store veya Google Play üzerinden yapılır. Abonelik durumunu RevenueCat hizmeti, uygulamanın anonim kimliğiyle kontrol eder; ad, e-posta ya da günlük içeriği kullanılmaz.",
    },
    ads: {
      title: "Reklam ve izleme",
      text: "Uygulamada reklam ve üçüncü taraf analiz araçları yoktur; sizi başka uygulamalarda ve web sitelerinde izlemeyiz.",
    },
    deletion: {
      title: "Verilerin silinmesi",
      text: "İlerlemenizi Ayarlar’dan sıfırlayabilirsiniz (bu hem kayıtları hem de AI koçu verilerini siler); yalnızca kayıtları ve AI koçunun hafızasını silmek için Ayarlar → AI koçu bölümüne gidin. Uygulamayı silmek her şeyi siler. Aboneliğinizi mağaza ayarlarından yönetebilirsiniz.",
    },
  },
};
