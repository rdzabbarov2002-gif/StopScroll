import type { Messages } from "./ru";

export const tr: Messages = {
  triggers: {
    boredom: {
      label: "Can sıkıntısı",
      hint: "Yeni bir şey istiyorum",
      ask: "Canım sıkılıyordu",
      noun: "can sıkıntısı",
      because: "can sıkıntısından",
      reason: "can sıkıntısından",
      advice:
        "Can sıkıntısı yeniliğe duyulan açlıktır; akış onu boş kalorilerle besler. Elinizin altında “gerçek” bir yenilik bulundurun: bir kitap, bir bulmaca, yeni bir rota.",
    },
    fatigue: {
      label: "Yorgunluk",
      hint: "Hiçbir şeye gücüm yok",
      ask: "Hiç gücüm yoktu",
      noun: "yorgunluk",
      because: "yorgunluktan",
      reason: "yorgunluktan",
      advice:
        "Yorgun beyin en kolayını seçer. Akış dinlendirmez, kalan gücü de alır. 3 dakika gözlerinizi kapatmayı ya da pencere kenarında bir bardak su içmeyi deneyin.",
    },
    stress: {
      label: "Stres",
      hint: "Kaçmak istiyorum",
      ask: "Kaygılıydım",
      noun: "stres",
      because: "stresten",
      reason: "stresten",
      advice:
        "Akış kaçış vaat eder ama sonrasında kaygı daha güçlü döner. Önce beden: uzun bir nefes verme, hareket, soğuk su — kararlar sonra.",
    },
    loneliness: {
      label: "Yalnızlık",
      hint: "İnsanları özledim",
      ask: "Kendimi yalnız hissettim",
      noun: "yalnızlık",
      because: "yalnızlıktan",
      reason: "yalnızlıktan",
      advice:
        "Akıştaki başkalarının hayatları gerçek temasın yerini tutmaz. Gerçek bir insana kısa bir mesaj, bir saatlik videodan daha fazlasını verir.",
    },
    procrastination: {
      label: "Erteleme",
      hint: "Bir işi erteliyorum",
      ask: "İşe başlamak istemedim",
      noun: "işleri erteleme",
      because: "işleri ertelerken",
      reason: "işleri ertelediğinizde",
      advice:
        "Akış, başlamamanın en rahat yoludur. Görevi 2 dakikalık bir adıma indirin ve yalnızca onu yapın.",
    },
    autopilot: {
      label: "Otomatik pilot",
      hint: "Elim kendiliğinden açtı",
      ask: "Kendiliğinden açıldı, otomatik olarak",
      noun: "otomatik pilot",
      because: "otomatik pilotta",
      reason: "otomatik pilotta",
      advice:
        "Alışkanlık düşünceden önce devreye girer. Uygulamaları ana ekrandan kaldırın ve telefonu ekranı aşağı bakacak şekilde bırakın — küçük engeller otomatik pilotu bozar.",
    },
    relax: {
      label: "Dinlenme",
      hint: "Rahatlamak istiyorum",
      ask: "Rahatlamak istedim",
      noun: "dinlenme isteği",
      because: "dinlenme isteğiyle",
      reason: "rahatlamak istediğinizde",
      advice:
        "Akış dinlenme vaat eder ama bunu nadiren verir. Sonrasında gerçekten hafiflediğiniz bir dinlenme seçin: duş, gözler kapalı müzik, beş dakika esneme.",
    },
    sleepless: {
      label: "Uykusuzluk",
      hint: "Uyuyamıyorum",
      ask: "Uyuyamadım",
      noun: "uykusuzluk",
      because: "uykusuzluktan",
      reason: "uyuyamadığınızda",
      advice:
        "Parlak ekran beyni daha da uyandırır. Uyuyamıyorsanız ışığı kısın ve on dakika kadar basılı bir kitap okuyun; telefonu da yatak odasının dışında şarj edin.",
    },
    other: {
      label: "Diğer",
      hint: "Kendi nedenim",
      ask: "Başka bir şey",
      noun: "diğer nedenler",
      because: "başka nedenlerle",
      reason: "farklı nedenlerle",
      advice:
        "Hemen öncesinde ne olduğunu birkaç kelimeyle yazmak, neyin tekrarlandığını fark etmenize yardımcı olur. Not edin — zamanla her şey netleşir.",
    },
  },

  feedApps: {
    other: "Diğer",
  },

  categories: {
    body: { label: "Beden", description: "1–3 dakikalık hareket" },
    mind: { label: "Zihin", description: "Kafayı çalıştıran görevler" },
    facts: { label: "Bilgiler", description: "Kısa ve faydalı yenilikler" },
  },

  items: {
    squats: {
      title: "15 squat",
      description: "Beyne hızlı bir kan akışı ve yapılan işin verdiği dürüst dopamin.",
      steps: [
        "Ayağa kalkın, ayaklarınız omuz genişliğinde açık olsun.",
        "Sırtınız dik, 15 yavaş squat yapın.",
        "Sonunda derin bir nefes alın ve bedeninizin nasıl ısındığını fark edin.",
      ],
    },
    "neck-shoulders": {
      title: "Boyun ve omuz esnetme",
      description: "Telefona bakmaktan biriken gerginliği alır.",
      steps: [
        "Başınızı yavaşça sağ omzunuza, sonra sol omzunuza doğru eğin — her yöne 3 kez.",
        "Omuzlarınızla geriye doğru 10 daire çizin.",
        "Ellerinizi arkada birleştirin ve 3 nefes boyunca göğsünüzü açın.",
      ],
    },
    "eyes-20-20": {
      title: "20-20-20 göz molası",
      description: "Ekran odağınızı 30 cm’de tutar. Gözlerinize uzakları gösterin.",
      steps: [
        "Pencereye gidin ya da odadaki en uzak noktayı bulun.",
        "20 saniye ona bakın, gözlerinizi zorlamadan kırpın.",
        "Avuçlarınızla gözlerinizi 20 saniye kapatın, sonra 10 kez yavaşça kırpın.",
      ],
    },
    "cold-water": {
      title: "Soğuk su",
      description: "Yüzünüzü yıkamak ve bir bardak su — sinir sistemi için hızlı bir sıfırlama.",
      steps: [
        "Yüzünüzü soğuk suyla yıkayın ya da bileklerinizi 30 saniye akan suyun altında tutun.",
        "Bir bardak suyu yavaşça için.",
        "Bedeninizde neyin değiştiğine dikkat edin.",
      ],
    },
    "walk-3": {
      title: "Üç dakika yürüyüş",
      description: "Amaçsız hareket, dikkati yeniden başlatmanın en iyi yoludur.",
      steps: [
        "Telefonu masada bırakın.",
        "Üç dakika boyunca evde, ofiste ya da merdivenlerde yürüyün.",
        "Yol boyunca üç yeni ayrıntı fark edin.",
      ],
    },
    "tidy-surface": {
      title: "Bir yüzeyi toparlama",
      description: "Küçük ama tamamlanmış bir iş, kontrol hissi verir.",
      steps: [
        "Tek bir yüzey seçin: masa, raf, pencere kenarı.",
        "3 dakikada üzerindeki fazlalıkları kaldırın.",
        "Sonuca bakın — bu sizin zaferiniz.",
      ],
    },
    plank: {
      title: "45 saniye plank",
      description: "Kaygıdan bedene geçiren kısa bir çaba.",
      steps: [
        "Önkollarınızın üzerinde plank pozisyonuna geçin, bedeniniz düz bir çizgi olsun.",
        "45 saniye tutun, düzenli nefes alın.",
        "15 saniye uzanarak dinlenin, tüm bedeninizi gevşetin.",
      ],
    },
    "shake-off": {
      title: "Gerginliği silkeleme",
      description: "Hayvanlar tehlikeden sonra stresi böyle atar.",
      steps: [
        "Ayağa kalkın ve 20 saniye ellerinizi silkeleyin.",
        "Omuzları, sonra bacakları da ekleyin — 30 saniye daha.",
        "Durun ve üç kez yavaşça nefes verin.",
      ],
    },
    "muscle-relax": {
      title: "Kas gevşetme",
      description: "Sırayla germe ve gevşetme — 3 dakikada derin dinlenme.",
      steps: [
        "Yumruklarınızı 5 saniye sıkın, sonra birden gevşetin.",
        "Aynısını omuzlar, yüz, karın ve bacaklar için tekrarlayın.",
        "Sonunda 30 saniye uzanın ya da oturun ve bedeninizin ağırlığını hissedin.",
      ],
    },
    "serial-sevens": {
      title: "100’den yedişer geri sayım",
      description: "Prefrontal korteksi çalıştırır ve otomatik dürtüyü keser.",
      steps: [
        "100’den başlayarak aklınızdan hep 7 çıkarın: 93, 86, 79…",
        "Yanıldınız mı? Son doğru sayıdan devam edin.",
        "10’un altına inene kadar sürdürün.",
      ],
    },
    "two-minute-step": {
      title: "2 dakikalık adım",
      description: "Akış yerine ertelenen bir işin en küçük adımı.",
      steps: [
        "Ertelediğiniz bir işi düşünün.",
        "İçinde 2 dakika sürecek bir adım bulun: dosyayı açmak, ilk satırı yazmak.",
        "Yalnızca onu yapın. Devam etmek zorunda değilsiniz.",
      ],
    },
    gratitude: {
      title: "Üç güzel şey",
      description: "Dikkati eksik olandan zaten var olana çevirir.",
      steps: [
        "Bugünden üç güzel anı hatırlayın — küçük de olsa.",
        "Her biri için kendinize sorun: Bu neden oldu?",
        "Kâğıt varsa bir cümle yazın.",
      ],
    },
    "message-human": {
      title: "Gerçek birine yazmak",
      description: "Başkalarının bitmeyen hayatları yerine gerçek bir temas.",
      steps: [
        "Uzun zamandır konuşmadığınız birini seçin.",
        "Ona sıcak bir mesaj ya da bir soru yazın.",
        "Cevabı beklemeden mesajlaşma uygulamasını kapatın.",
      ],
    },
    "brain-dump": {
      title: "Zihni boşaltmak",
      description: "Düşünceler kafanızda değil kâğıtta olunca kaygı azalır.",
      steps: [
        "Bir kâğıt alın ya da notları açın.",
        "Aklınızdan geçen her şeyi 2 dakika durmadan yazın.",
        "Bugün yapabileceğiniz bir şeyin altını çizin.",
      ],
    },
    "alphabet-game": {
      title: "Alfabe oyunu",
      description: "Yenilik açlığını gideren hafif bir zihin oyunu.",
      steps: [
        "Bir konu seçin: şehirler, hayvanlar, yemekler.",
        "Alfabenin her harfi için bir kelime bulun.",
        "Takıldınız mı? O harfi atlayın, sonda ona dönün.",
      ],
    },
    "evening-plan": {
      title: "Akşamı hayal etmek",
      description: "Beyin daha iyi bir plan gördüğünde akışı daha kolay bırakır.",
      steps: [
        "Gözlerinizi kapatın.",
        "Önümüzdeki bir saati akış olmadan nasıl geçireceğinizi ayrıntılarıyla hayal edin.",
        "İlk adımı seçin ve gözlerinizi açın.",
      ],
    },
    "facts-brain": {
      title: "Beyin ve alışkanlıklar",
      description: "Akışa çekilme nasıl işler — ve neden değiştirilebilir.",
      steps: [
        "Dopamin, hazzın kendisinden çok ödül beklentisiyle ilgilidir. Bu yüzden sonsuz akış, herhangi bir videodan daha çok bağlar.",
        "Kısa videolar kumar makinesi gibi çalışır: ödül ne zaman geleceği belli olmadan gelir ve beyin “kolu çekmeye” devam eder.",
        "Dürtü bir dalga gibidir: yükselir ve sonra çekilir. Kısa bir mola bile otomatik eylemi böler ve başka bir seçim yapma şansı verir.",
        "Beynin duygusal sistemleri, öz denetimden sorumlu “yönetici” olan prefrontal korteksten daha hızlı tepki verir. Mola, ona dürtüye yetişmesi için zaman tanır.",
        "Yeni bir alışkanlık aynı bağlamda tekrarlandıkça yerleşir. Aynı durumda hep aynı alternatif, çeşitlilikten daha iyi işler.",
      ],
    },
    "facts-nature": {
      title: "Şaşırtıcı doğa",
      description: "Akış yerine biraz canlı yenilik.",
      steps: [
        "Ahtapot dünyayı vantuzlarıyla “tadar”: kollarındaki reseptörler tatları ayırt eder.",
        "Ormandaki ağaçlar, köklerini saran mantar ağları aracılığıyla madde alışverişi yapabilir.",
        "Bir sinek kuşunun kalbi dakikada 1.000’den fazla atabilir.",
        "Deniz su samurları uyurken akıntı onları ayırmasın diye birbirlerinin patilerini tutar.",
        "Arılar çiçeklerin yönünü birbirlerine “sallanma dansı” ile anlatır.",
      ],
    },
    "facts-space": {
      title: "Bir dakikada uzay",
      description: "Yanında akışın küçücük kaldığı bir ölçek.",
      steps: [
        "Güneş’in ışığı Dünya’ya yaklaşık 8 dakikada ulaşır — Güneş’i hep biraz geçmişte görürüz.",
        "Venüs’te bir gün bir yıldan uzundur: kendi ekseni etrafında, Güneş’in etrafında döndüğünden daha yavaş döner.",
        "Gözlemlenebilir evrendeki yıldızlar, Dünya’daki tüm kumsallardaki kum tanelerinden daha fazladır.",
        "Astronotların Ay’daki ayak izleri milyonlarca yıl kalabilir — orada rüzgâr yok.",
        "Bir nötron yıldızı o kadar yoğundur ki maddesinin bir çay kaşığı milyarlarca ton gelirdi.",
      ],
    },
    "facts-history": {
      title: "Ayrıntılarda tarih",
      description: "Başkalarına anlatmak isteyeceğiniz kısa hikâyeler.",
      steps: [
        "Kleopatra, Keops Piramidi’nin inşasından çok Ay’a ilk inişe daha yakın bir zamanda yaşadı.",
        "Oxford Üniversitesi, Aztek Devleti’nden daha eskidir.",
        "Tarihin en kısa savaşı — 1896’daki İngiliz-Zanzibar Savaşı — bir saatten kısa sürdü.",
        "Antik Roma’da da “fast food” vardı: sıcak yemek satan sokak termopolyumları.",
        "“Robot” kelimesi ilk kez Karel Čapek’in 1920 tarihli oyununda geçti; kelimeyi aslında yazarın kardeşi Josef buldu.",
      ],
    },
  },

  breath: {
    inhale: "Nefes alın",
    exhale: "Nefes verin",
    hold: "Tutun",
    rest: "Bekleyin",
  },

  exercises: {
    "breath-ground": {
      title: "Nefes ve topraklanma",
      subtitle: "Uzun nefes verme + 3-2-1 tekniği",
      prompts: [
        "Şu an gördüğünüz 3 nesneyi içinizden sayın",
        "2 dayanak noktasını hissedin: yerdeki ayaklarınızı ve sırtınızı",
        "1 kez uzun bir nefes verin ve omuzlarınızı indirin",
      ],
    },
    "box-breath": {
      title: "Kutu nefesi",
      subtitle: "Yoğun stres için düzenli bir ritim",
      prompts: [
        "Burnunuzdan nefes alın — dörde kadar sayın",
        "Zorlamadan nefesinizi tutun",
        "Ağzınızdan yavaşça nefes verin",
        "Bekleyin. İçinizdeki sessizliği fark edin",
      ],
    },
    "serial-sevens": {
      title: "100’den yedişer geri sayım",
      subtitle: "Beynin “yöneticisini” devreye sokar",
      prompts: [
        "İçinizden hesaplayın: 100 − 7 = ?",
        "Doğru, 93. Devam: 93 − 7 = ?",
        "Bu 86. Bir daha: 86 − 7 = ?",
      ],
    },
    "intent-check": {
      title: "Üç dürüst soru",
      subtitle: "Otomatik pilot yerine farkındalık",
      prompts: [
        "Şu an ne hissediyorum — tek kelimeyle?",
        "Akıştan gerçekte ne almak istiyorum?",
        "Bu duyguyu bana telefonsuz ne verebilir?",
      ],
    },
  },

  equivalents: {
    books: {
      unit: { one: "kitap", other: "kitap" },
      caption: "ortalama bir kitap ≈ 5 saatlik okuma",
    },
    sleep: {
      unit: { one: "saat uyku", other: "saat uyku" },
      caption: "uykuya geri verebileceğiniz zaman",
    },
    walks: {
      unit: { one: "yürüyüş", other: "yürüyüş" },
      caption: "her biri 30 dakika, açık havada",
    },
    workouts: {
      unit: { one: "antrenman", other: "antrenman" },
      caption: "her biri 45 dakika",
    },
    language: {
      unit: { one: "dil dersi", other: "dil dersi" },
      caption: "her biri 20 dakika",
    },
    calls: {
      unit: { one: "sohbet", other: "sohbet" },
      caption: "sevdiklerinizle, her biri 15 dakika",
    },
  },

  timeOfDay: {
    morning: { label: "Sabah", phrase: "sabahları" },
    afternoon: { label: "Gündüz", phrase: "gündüzleri" },
    evening: { label: "Akşam", phrase: "akşamları" },
    night: { label: "Gece", phrase: "geceleri" },
  },
};
