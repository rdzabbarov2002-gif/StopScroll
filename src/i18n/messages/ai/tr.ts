import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

/**
 * ai — Turkish. The user is addressed as "siz" throughout; nothing refers to the user's gender.
 * Weekday indexes are Monday-first (0 = Pazartesi … 6 = Pazar), month indexes are 0 = Ocak.
 *
 * Case suffixes are never attached to an interpolated number or word whose vowel harmony is
 * unknown: sentences use constructions like "5 seferde 3 kez", "… gününden 3 tanesi",
 * "saat 23:00 olana kadar" or "3/5", where every suffix sits on a fixed word.
 * Turkish puts the percent sign before the number: "%60", "−%20".
 */

type Part = "morning" | "day" | "evening" | "night";
type Focus = Part | "all";

/** A number and its word never break apart: "3 gün". */
const NB = " ";
const word = (value: number, forms: PluralForms) => selectPlural("tr", value, forms);
const count = (value: number, forms: PluralForms) => `${value}${NB}${word(value, forms)}`;
/** Turkish capitals: "i" → "İ". */
const cap = (text: string) => {
  const first = text.charAt(0);
  return (first === "i" ? "İ" : first.toUpperCase()) + text.slice(1);
};

// Turkish keeps the noun singular after a number, so one form serves every count.
const DAYS: PluralForms = { one: "gün", other: "gün" };
const SLIPS: PluralForms = { one: "kaçamak", other: "kaçamak" };
const TIMES: PluralForms = { one: "kez", other: "kez" };
const MONTHS: PluralForms = { one: "ay", other: "ay" };
const FILMS: PluralForms = { one: "film", other: "film" };
const PAGES: PluralForms = { one: "kitap sayfası", other: "kitap sayfası" };
const WALKS: PluralForms = { one: "yürüyüş", other: "yürüyüş" };
const ENTRIES: PluralForms = { one: "kayıt", other: "kayıt" };
/** An eight-hour working day: "2 iş günü". */
const SHIFTS: PluralForms = { one: "iş günü", other: "iş günü" };

/** "5 seferde 3 kez" */
const timesOf = (value: number, of: number) => `${of}${NB}seferde ${count(value, TIMES)}`;

const WEEKDAY = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/**
 * "son 4 Salı gününden 3 tanesi zor geçti" — every suffix goes on "gün", so it works for any
 * weekday and any number. Lowercase: the caller capitalizes it at the start of a sentence.
 */
const hardOfLast = (hard: number, of: number, weekday: number) => {
  const name = WEEKDAY[weekday] ?? "";
  if (of === 1) return hard > 0 ? `son ${name} günü zor geçti` : `son ${name} günü zor geçmedi`;
  const last = `son ${of}${NB}${name}`;
  if (hard === 0) return `${last} gününün hiçbiri zor geçmedi`;
  if (hard === of) return `${last} gününün ${of === 2 ? "ikisi de" : "hepsi"} zor geçti`;
  return `${last} gününden ${hard}${NB}tanesi zor geçti`;
};

/** "Son 4 Salı gününden 3 tanesi zor geçti." */
const hardWeekdays = (hard: number, of: number, weekday: number) =>
  `${cap(hardOfLast(hard, of, weekday))}.`;

/** "çoğunlukla akşamları" — how often something happens at that part of the day. */
const HABITUAL: Record<Part, string> = {
  morning: "sabahları",
  day: "öğleden sonraları",
  evening: "akşamları",
  night: "geceleri",
};

/** "özellikle akşam saatlerinde", "akış akşam saatlerinde 2 kez kazandı". */
const AT_PART: Record<Part, string> = {
  morning: "sabah saatlerinde",
  day: "öğleden sonra",
  evening: "akşam saatlerinde",
  night: "gece saatlerinde",
};

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export const tr: Messages = {
  yes: "Evet",
  no: "Hayır",

  errors: {
    offline: "İnternet bağlantısı yok. Bağlantı geri geldiğinde analiz devam edecek.",
    timeout: "ChatGPT yanıt vermekte gecikiyor. Birazdan yeniden deneyeceğiz.",
    busy: "Servis şu anda çok yoğun. Birkaç dakika içinde yeniden deneyeceğiz.",
    unavailable: "ChatGPT şu anda kullanılamıyor. Birkaç dakika içinde yeniden deneyeceğiz.",
    server: "AI koçu sunucusuna ulaşılamıyor. Daha sonra yeniden deneyeceğiz.",
    unusable: "ChatGPT’nin yanıtı okunamadı. Yeniden deneyeceğiz.",
  },

  sync: {
    entry: "ChatGPT kaydı inceliyor…",
    deep: "ChatGPT tüm geçmişinizin analizini güncelliyor…",
    translate: "ChatGPT koçun hafızasını yeni dile çeviriyor…",
    retry: "Yeniden dene",
    updated: (when: string) => `Analiz güncellendi: ${when}`,
    today: (time: string) => `bugün saat ${time}`,
    onDate: (date: string, time: string) => `${date} saat ${time}`,
  },

  date: {
    month: (month: number, year: number) => `${MONTH_NAMES[month]} ${year}`,
    months: (fromMonth: number, fromYear: number, toMonth: number, toYear: number) =>
      fromYear === toYear && fromMonth === toMonth
        ? `${MONTH_NAMES[fromMonth]} ${fromYear}`
        : fromYear === toYear
          ? `${MONTH_NAMES[fromMonth]}–${MONTH_NAMES[toMonth]} ${toYear}`
          : `${MONTH_NAMES[fromMonth]} ${fromYear} – ${MONTH_NAMES[toMonth]} ${toYear}`,
  },

  impulse: {
    label: "Dürtü",
    question: "Akışı açmak istemeden hemen önce ne oldu?",
    placeholder: "Ne olduğunu kendi sözlerinizle anlatın…",
    inputA11y: "Akışı açmak istemeden hemen önce ne oldu",
    outcomeLabel: "Nasıl sonuçlandı — biliyorsanız",
    resisted: "Direndim",
    opened: "Akışı açtım",
    save: "Kaydet",
    analysis: "Kayıt analizi",
    hide: "Analizi gizle",
    allAnalytics: "Tüm AI analizleri",
    sos: "SOS molası",
    notConfigured:
      "Kayıt saklandı. Bu sürümde AI analizi bağlı değil, bu yüzden ChatGPT onu okumayacak.",
    needConsent:
      "Kayıt telefonunuzda saklandı. ChatGPT’nin incelemesi için kayıtların gönderilmesine izin vermeniz gerekiyor.",
    allow: "Analize izin ver",
    failed: "ChatGPT’den analiz alınamadı. Kayıt saklandı.",
    retry: "Yeniden dene",
    analyzing: "Kayıt saklandı. ChatGPT onu inceliyor…",
  },

  entry: {
    cause: "Neden",
    emotion: "Ruh hâli",
    context: "Durum",
    behavior: "Davranış türü",
    colon: ": ",
    notEnough: (missing: string | null) =>
      missing
        ? `Kesin bir sonuç için henüz yeterli bilgi yok: ${missing}`
        : "Kesin bir sonuç için henüz yeterli bilgi yok.",
  },

  history: {
    title: "Kayıt geçmişi",
    count: (value: number) => count(value, ENTRIES),
    more: "Daha fazla göster",
    failed: "Analiz alınamadı",
    waiting: "Analiz bekleniyor",
    unclear: "Neden belirsiz",
    resisted: " · direnildi",
    opened: " · akış açıldı",
    retry: "Yeniden analiz et",
    confirmDelete: "Kayıt silinsin mi?",
    cancel: "Vazgeç",
    delete: "Sil",
    deleteEntry: "Kaydı sil",
  },

  screen: {
    overline: "Kişisel analiz",
    title: "AI koçu",
    preparing: "Analiz hazırlanıyor",
    startEntry:
      "Ana sayfada bir kayıtla başlayın: akışı açmak istemeden hemen önce ne olduğunu yazın.",
    studying: "ChatGPT geçmişinizi inceliyor — ilk sonuçlar burada kendiliğinden görünecek.",
    moreEntries:
      "Kayıt arttıkça örüntüler ve tahminler daha isabetli olur. Elle bir şey başlatmanıza gerek yok.",
    notConnected: "Bağlı değil",
    notConnectedTitle: "Bu sürümde AI analizi bağlı değil.",
    notConnectedText:
      "Kayıtlar telefonunuzda saklanıyor. Uygulama AI koçu sunucusuna bağlandığında ChatGPT birikmiş tüm geçmişi inceleyecek.",
    demoNote:
      "Bu örnek bir ekran. Web demosunda ChatGPT bağlı değil, bu yüzden aşağıdaki metinler verilerinizin analizi değil, yalnızca bir örnek. Uygulamada bu metinleri ChatGPT sizin geçmişinize göre yazar.",
  },

  consent: {
    label: "İzniniz",
    declined: "AI analizi kapalı — kayıtlar yalnızca telefonunuzda kalıyor.",
    ask: "AI koçunun alışkanlıklarınızı incelemesi için izniniz gerekiyor",
    text: "Kayıtlarınız, sorulara verdiğiniz yanıtlar ve alışkanlık istatistikleriniz (akışta geçen süre, kaçamaklar, zaferler — adınız, e-postanız ve rehberiniz olmadan) StopScroll sunucusu üzerinden OpenAI sunucularına gönderilir ve orada ChatGPT tarafından analiz edilir. OpenAI kurallarına göre API üzerinden gönderilen veriler model eğitiminde kullanılmaz. Koçun hafızası ve geçmişiniz yalnızca telefonunuzda saklanır. Bu özelliği istediğiniz zaman Ayarlar’dan kapatabilirsiniz.",
    allow: "Analize izin ver",
    notNow: "Şimdi değil",
  },

  question: {
    label: "Netleştirici soru",
    skip: "Atla",
  },

  highlights: {
    label: "AI koçundan öne çıkanlar",
    a11y: "AI koçundan öne çıkanlar, analizi aç",
  },

  forecast: {
    title: "Bugün için tahmin",
    probabilityA11y: (percent: number) => `Bugün akışı açma olasılığı: yüzde ${percent}`,
    probabilityCaption: "bugün akışı açma olasılığı",
    helps: "Bugün ne yardımcı olabilir",
    updatedAt: (time: string) => `Güncellendi: ${time}`,
    analytics: "Analiz",
    soon: "Bugün için tahmin yakında burada olacak.",

    hardPart: {
      morning: "Bu sabah muhtemelen zorlu geçecek.",
      day: "Bu öğleden sonra muhtemelen zorlu geçecek.",
      evening: "Bu akşam muhtemelen zorlu geçecek.",
      night: "Bu gece muhtemelen zorlu geçecek.",
    },
    medium: (rest: boolean, part: Part | null) =>
      `${rest ? "Günün geri kalanı" : "Bugün"} zorlu geçebilir${part ? `, özellikle ${AT_PART[part]}` : ""}.`,
    lowRest: "Günün geri kalanı muhtemelen daha sakin geçecek.",
    low: "Bugün sakin bir gün olacak gibi görünüyor.",
    preliminary: "Tahmin şimdilik kesin değil: geçmiş henüz kısa.",
    passedHeadline: "Bugünün en zor zamanı geride kaldı.",
    passed: (from: string, to: string) =>
      `${from}–${to} arasındaki riskli saatler geride kaldı ve bugün sakin geçti.`,

    overLimit: (feed: string, limit: string) => `Bugünkü limitiniz doldu: ${feed} / ${limit}.`,
    slipToday: "Bugün zaten bir kaçamak oldu — böyle günlerde dürtüler genellikle daha güçlü olur.",
    openedToday: "Bugün akış zaten açıldı — böyle günlerde dürtüler genellikle daha güçlü olur.",
    window: (inWindow: number, total: number, from: string, to: string) =>
      `Son iki aydaki ${total} kaçamak ve kayıttan ${inWindow}${NB}tanesi ${from} ile ${to} arasında.`,
    weekdayHard: hardWeekdays,
    weekdayCalm: (hard: number, of: number, weekday: number) =>
      `${WEEKDAY[weekday] ?? ""} günleri genelde sakin geçiyor: ${hardOfLast(hard, of, weekday)}.`,
    afterHardUsuallyHard: (hard: number, of: number) =>
      hard === 0
        ? `Dün zor bir gündü; böyle bir günün ertesi ${of}${NB}seferin hiçbirinde zor geçmedi.`
        : `Dün zor bir gündü; böyle bir günün ertesi ${timesOf(hard, of)} zor geçti.`,
    afterHardUsuallyFine: (hard: number, of: number) =>
      hard === 0
        ? `Dün zor bir gündü, ama genellikle çabuk toparlanıyorsunuz: böyle bir günün ertesi ${of}${NB}seferin hiçbirinde zor geçmedi.`
        : `Dün zor bir gündü, ama genellikle çabuk toparlanıyorsunuz: böyle bir günün ertesi ${timesOf(hard, of)} zor geçti.`,
    afterHard: "Dün zor bir gündü.",
    recentSlips: (slips: number) =>
      slips === 0
        ? "Son üç günde hiç kaçamak olmadı."
        : `Son üç günde ${count(slips, SLIPS)} oldu — dürtüler şu an her zamankinden güçlü.`,
    streak: (days: number) => `Üst üste ${days}${NB}gündür limitinizin içinde kalıyorsunuz.`,
    calmWeek: "Son bir haftada akış bir kez bile kazanmadı.",
    plan: (from: string, to: string) =>
      `${from}–${to} arasını akış yerine nasıl geçireceğinize önceden karar verin.`,
    needDays: (min: number, have: number) =>
      `Tahmin için son dört haftada en az ${min}${NB}kayıtlı gün gerekiyor — ${
        have === 0 ? "henüz hiç yok" : `şimdilik ${count(have, DAYS)} var`
      }.`,
    noSignals: "Bugün belirgin bir risk işareti yok.",
    windowRest: (to: string) =>
      `Saat ${to} olana kadar akışı bir daha açmazsanız günün geri kalanı daha sakin geçecek.`,
    windowDay: (to: string) =>
      `Saat ${to} olana kadar akışı açmazsanız sakin bir gün geçirme şansınız belirgin şekilde artar.`,
    basis: (days: number) => `${days}${NB}günlük geçmiş`,
  },

  analytics: {
    conclusion: "Genel sonuç",
    warnings: "Riskli dönemler",
    changes: "Neler değişiyor",
    causes: "Sık nedenler",
    situations: "Tekrarlayan durumlar",
    emotions: "Duygusal durumlar",
    times: "Riskli saatler ve günler",
    hypotheses: "Hipotezler",
    confidence: {
      low: "Zayıf işaretler",
      medium: "Belirgin işaretler",
      high: "Güçlü işaretler",
    },
    notFact: "henüz bir varsayım, kesin değil",
    confirmed: "denemeyle doğrulandı",
    self: "Kendinizle kıyaslama",
    saved: "Geri kazandığınız zaman",
    memory: "Uzun vadeli hafıza",

    conclusionPending: "Sonuçlar, geçmişinizin bir sonraki analizinden sonra görünecek.",
    fewDays: "Henüz veri az — sonuçlar birkaç hafta içinde daha isabetli olacak.",
    fewEntries: "Henüz kayıt az: kayıtlar arttıkça nedenler ve durumlar netleşecek.",

    causeNote: (value: number, of: number, part: Part | null) =>
      `${of}${NB}durumdan ${value}${NB}tanesi${part ? `, çoğunlukla ${HABITUAL[part]}` : ""}`,

    slipsDown: (recent: number, previous: number) =>
      `Son iki haftada kaçamaklar azaldı: ${recent}, önceki iki haftada ise ${previous}.`,
    slipsUp: (recent: number, previous: number) =>
      `Son iki haftada kaçamaklar arttı: ${recent}, önceki iki haftada ise ${previous}.`,
    feedDown: (week: string, before: string) =>
      `Akışta daha az zaman geçiyor: bu hafta günde ortalama ${week}, bir önceki hafta ${before}.`,
    feedUp: (week: string, before: string) =>
      `Akışta daha çok zaman geçiyor: bu hafta günde ortalama ${week}, bir önceki hafta ${before}.`,
    heldMore: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Daha sık direniyorsunuz: son iki haftada ${resisted}/${of} kayıt, öncesinde ${before}/${beforeOf}.`,
    heldLess: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Direnmek zorlaştı: son iki haftada ${resisted}/${of} kayıt, öncesinde ${before}/${beforeOf}.`,

    calmSame: (percent: number) => `Bu ay da geçen ayki kadar sakin gün var: %${percent}.`,
    calmVs: (percent: number, before: number) =>
      `Bu ay sakin günlerin oranı %${percent}, geçen ay ise %${before}.`,
    weekVsUsual: (week: number, usual: string) =>
      `${week === 0 ? "Son 7 günde hiç kaçamak olmadı" : `Son 7 günde ${count(week, SLIPS)} oldu`}; geçen ay haftada ortalama ${usual}${NB}kaçamak oluyordu.`,
    streakRecord: (days: number) => `Şu anki seriniz ${count(days, DAYS)} — bu sizin rekorunuz.`,
    streakBest: (days: number, best: number) =>
      `Şu anki seriniz ${count(days, DAYS)}, en iyisi ${count(best, DAYS)}.`,

    hardestMoved: (before: number, now: number) =>
      `Haftanın en zor günü eskiden ${WEEKDAY[before] ?? ""} günüydü, şimdi ${WEEKDAY[now] ?? ""} günü.`,
    partMoved: (before: Part, now: Part) =>
      `Kaçamakların zamanı değişti: eskiden çoğunlukla ${HABITUAL[before]}, şimdi ${HABITUAL[now]}.`,
    feedVsMonthsAgo: (now: string, before: string, months: number) =>
      `Akışta geçen ortalama süre günde ${now}; ${count(months, MONTHS)} önce ise ${before}.`,
    bestStreak: (days: number) => `En iyi seri: limit içinde ${count(days, DAYS)}.`,
    longestCalm: (days: number) => `Kaçamaksız en uzun dönem: ${count(days, DAYS)}.`,
    years: (before: number, beforeShare: number, year: number, share: number) =>
      `Zor günlerin oranı ${before} yılında %${beforeShare}, ${year} yılında %${share}.`,

    chapter: (month: string, note: string, calm: number | null) =>
      `${cap(month)}: ${note}${calm === null ? "" : ` Sakin gün oranı: %${calm}.`}`,
    correction: (was: string, now: string, why: string | null) =>
      `Önceden: ${was}. Şimdi daha net: ${now}${why ? ` (${why})` : ""}.`,
    scoped: (text: string, period: string) => `${text} (${period}; artık geçerli değil).`,
    event: (date: string, note: string) => `${date}: ${note}`,

    savedHeadline: (duration: string) => `Kendinize ${duration} geri kazandırdınız.`,
    films: (films: number) => `yaklaşık ${count(films, FILMS)}`,
    oneShift: "tam bir iş günü",
    shifts: (shifts: number) => count(shifts, SHIFTS),
    walks: (walks: number) => `30’ar dakikalık ${count(walks, WALKS)}`,
    pages: (pages: number) => count(pages, PAGES),

    windowNote: (inWindow: number, total: number) =>
      `Son iki aydaki ${total} kaçamak ve kayıttan ${inWindow}${NB}tanesi bu saatlerde.`,
    weekdayTitle: (weekday: number) => WEEKDAY[weekday] ?? "",
    weekdayNote: hardWeekdays,
    afterRuns: (slipped: number, runs: number) =>
      slipped === 0
        ? `En az 4 günlük ${runs} sakin serinin hiçbirinin ardından üç gün içinde zor bir gün yaşanmadı.`
        : `En az 4 günlük sakin serilerin ardından üç gün içinde zor bir gün ${timesOf(slipped, runs)} yaşandı.`,
  },

  challenge: {
    label: "AI Challenge",
    proposed: "Küçük bir deney yapalım",
    day: (day: number, of: number) => `Deney · Gün ${day}/${of}`,
    pastResult: "Önceki deneyin sonucu",
    result: "Deneyin sonucu",
    duration: (days: number) => `${count(days, DAYS)} boyunca.`,
    try: "Dene",
    notNow: "Şimdi değil",
    daysA11y: "Deney günleri",
    todayQuestion: "Bugün başardınız mı?",
    managed: "Başardım",
    missed: "Başaramadım",
    managedToday: "Bugün başardınız — işaretlendi.",
    missedToday: "Bugün olmadı — bu da sonuç için bir veri.",
    reviewing: "Deney tamamlandı. Deneyden önceki ve deney sırasındaki günler karşılaştırılıyor…",
    finished: "Deney tamamlandı.",

    review: {
      managed: (days: number, of: number) => `Başarılan gün: ${days}/${of}.`,
      noData: "Deney günlerine ait kayıt yok, bu yüzden şimdilik karşılaştıracak bir şey yok.",
      losses: (focus: Focus, during: number, before: number, days: number, change: number | null) =>
        `${days}${NB}günlük deney boyunca akış${focus === "all" ? "" : ` ${AT_PART[focus]}`} ${
          during === 0 ? "hiç kazanmadı" : `${count(during, TIMES)} kazandı`
        }; deneyden önceki ${days}${NB}günde ${
          before === 0 ? "hiç kazanmamıştı" : `${count(before, TIMES)} kazanmıştı`
        }${
          change === null
            ? ""
            : ` (${change > 0 ? "+" : change < 0 ? "−" : ""}%${Math.abs(change)})`
        }.`,
      feed: (during: string, before: string) =>
        `Akışta günde ortalama ${during}; deneyden önce ${before}.`,
      fewBefore: "Deneyden önceki veriler az, bu yüzden karşılaştırma şimdilik kesin değil.",
      helps: "Görünüşe göre bu işe yarıyor — bu yöntemi sürdürmeye değer.",
      same: "Henüz bir fark görünmüyor — belki daha fazla gün gerekiyor.",
      worse: "Bu günler daha kolay geçmedi — demek ki mesele büyük ihtimalle başka bir şeyde.",
    },
  },

  demo: {
    forecast: {
      headline: "Bu akşam muhtemelen zorlu geçecek.",
      reasons: [
        "Son üç Pazar günü akışı 21:00 ile 23:00 arasında açtınız.",
        "Son üç günde üç kaçamak oldu — bu hafta için olağandan fazla.",
        "Bu ayki kaçamakların çoğu akşamın geç saatlerinde, yorgunluğun ardından oldu.",
      ],
      window:
        "Saat 23:00 olana kadar akışı açmazsanız sakin bir gün geçirme şansınız belirgin şekilde artar.",
      advice: "Saat 21:00 civarında telefonunuzu başka bir odada şarja takın.",
      basis: "örnek",
    },
    analytics: {
      conclusion:
        "Görünüşe göre akış çoğu zaman can sıkıntısından değil, uzun bir günün ardından gelen akşam yorgunluğundan kazanıyor. Gündüzleri bir ay öncesine göre belirgin şekilde daha iyi dayanıyorsunuz.",
      dataNote: "Hafta sonları hakkında sonuç çıkarmak için henüz yeterli kayıt yok.",
      warning: "En az 5 günlük sakin serilerin ardından iki kez hafta sonu gerileme yaşadınız.",
      improvement:
        "Son iki haftada akışı gündüzleri giderek daha seyrek açıyorsunuz: 6 yerine 2 kaçamak.",
      worsening: "Geç akşamlar zorlaştı: son 5 kaçamağın 4’ü 22:00’den sonra oldu.",
      habitChange: "Bu ay en çok iş sonrası alışkanlığınız değişti — daha sakin hâle geldi.",
      causes: [
        { title: "Yorgunluk", note: "Çoğunlukla hafta içi 21:00’den sonra." },
        { title: "Can sıkıntısı", note: "Çoğunlukla gündüz, molalarda." },
        { title: "Otomatik pilot", note: "Kilidi açar açmaz, sebepsiz yere açmak." },
      ],
      situation: { title: "İşten sonra, evde", note: "14 kaydın 6’sında tekrarlanıyor." },
      emotion: { title: "Tükenmişlik", note: "Neredeyse tüm akşam kayıtlarında görülüyor." },
      time: { title: "21:00–23:00", note: "Son bir aydaki 17 kaçamağın 15’i bu saatlerde." },
      weekday: { title: "Pazar", note: "Üç haftadır üst üste en zor gün." },
      hypothesis:
        "Görünüşe göre akşam yürüyüşleri akışı açma olasılığını azaltıyor: beş yürüyüşün ardından hiç kaçamak olmadı.",
      selfComparison: "Bu ay sakin günler geçen aya göre %24 daha fazla.",
      longTerm: [
        "Önceden: akış öğle saatlerinde can sıkıntısından kazanıyor. Şimdi daha net: akşamın geç saatlerinde yorgunluktan (son bir ayın kayıtları böyle gösteriyor).",
        "En iyi seri: limit içinde 9 gün.",
      ],
      savedHeadline: "Kendinize neredeyse 17 saat geri kazandırdınız.",
      equivalents: ["yaklaşık sekiz film", "iki iş günü", "30’ar dakikalık 34 yürüyüş"],
    },
    challenge: {
      title: "Telefon yatak odasının dışında",
      description:
        "Üç akşam üst üste, saat 22:30’dan itibaren telefonunuzu yatak odasının dışında şarj edin.",
      expectation: "Bakalım gece geç saatlerdeki kaçamaklar azalacak mı.",
    },
  },
};
