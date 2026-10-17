import { selectPlural, type PluralForms } from "../../plural";
import type { Cause, Messages } from "./ru";

/**
 * Turkish keeps the noun singular after a number ("3 kaçamak"), and suffixes never attach to a
 * number, time or name passed in: "5 kaçamaktan 3 tanesi", "21:00 sonrasında", "Cuma günleri".
 */
const count = (value: number, forms: PluralForms) =>
  `${value}\u00A0${selectPlural("tr", value, forms)}`;

const SLIPS: PluralForms = { one: "kaçamak", other: "kaçamak" };
const DAYS: PluralForms = { one: "gün", other: "gün" };
const TIMES: PluralForms = { one: "kez", other: "kez" };
const WALKS: PluralForms = { one: "yürüyüş", other: "yürüyüş" };
const ALTERNATIVES: PluralForms = { one: "alternatif", other: "alternatif" };

const WEEKDAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
/** "Cuma" — always followed by "günü", "günleri" or "gününden", never by a suffix. */
const day = (index: number) => WEEKDAYS[index] ?? "";

const ORDINALS = [
  "",
  "birinci",
  "ikinci",
  "üçüncü",
  "dördüncü",
  "beşinci",
  "altıncı",
  "yedinci",
  "sekizinci",
  "dokuzuncu",
  "onuncu",
];
const ordinal = (value: number) => ORDINALS[value] ?? `${value}.`;

/** Letters of the languages the coach speaks, for "not part of a word" checks. */
const LETTER = "A-Za-zÇçĞğİıÖöŞşÜüÂâÎîÛû";
const weekdayPattern = (stem: string, notFollowedBy = "") =>
  new RegExp(`(^|[^${LETTER}])${stem}${notFollowedBy ? `(?!${notFollowedBy})` : ""}`, "i");

export const tr: Messages = {
  greeting: {
    morning: "Günaydın",
    afternoon: "İyi günler",
    evening: "İyi akşamlar",
    night: "İyi geceler",
  },

  tidy: (text: string) =>
    text.replace(/(\d) \/ (\d)/g, "$1\u00A0/\u00A0$2").replace(/(\d) —/g, "$1\u00A0—"),

  guard: {
    forbidden: new RegExp(`(^|[^${LETTER}])YZ(?![${LETTER}])|yapay zek|sinir ağ|dil model`, "i"),
    weekdays: [
      weekdayPattern("pazartesi"),
      weekdayPattern("salı"),
      weekdayPattern("çarşamba"),
      weekdayPattern("perşembe"),
      weekdayPattern("cuma", "rtesi"),
      weekdayPattern("cumartesi"),
      weekdayPattern("pazar", "tesi"),
    ],
  },

  briefing: {
    risk: {
      hardWeekday: (index: number, bad: number, active: number) =>
        `${day(index)} günleri genelde zor geçiyor: son ${active} ${day(index)} gününden ${bad} tanesi zordu.`,
      calmWeekday: (index: number, bad: number, active: number) =>
        bad === 0
          ? `${day(index)} günleri kaçamak genelde nadir olur: son ${active} ${day(index)} gününün hiçbiri zor geçmedi.`
          : `${day(index)} günleri kaçamak genelde nadir olur: son ${active} ${day(index)} gününden yalnızca ${bad} tanesi zor geçti.`,
      recentSlips: (slips: number) =>
        `Son üç günde ${count(slips, SLIPS)} yaşandı — dürtüler şu sıralar her zamankinden güçlü.`,
      oneRecentSlip: "Son üç günde bir kaçamak yaşandı.",
      yesterdayOver: (scroll: string, limit: string) =>
        `Dün akışta ${scroll} geçti — ${limit} limitinin üzerinde.`,
      todayOver: (scroll: string, limit: string) =>
        `Bugünkü limit şimdiden aşıldı: ${scroll} / ${limit}.`,
      todaySlip: "Bugün zaten bir kaçamak yaşandı.",
      streak: (value: number) => `Art arda ${value}\u00A0gündür limit içinde kalıyorsun.`,
      heavierWeek: (recent: string, previous: string) =>
        `Son hafta bir öncekinden ağır geçti: günde ortalama ${recent} akış, önceki hafta ${previous}.`,
      lighterWeek: (recent: string, previous: string) =>
        `Son hafta bir öncekinden hafif geçti: günde ortalama ${recent} akış, önceki hafta ${previous}.`,
      calmWeek: "Son bir haftada hiç kaçamak olmadı.",
      noSignals: (slips: number) =>
        `Bugün belirgin bir risk sinyali yok: bu hafta ${count(slips, SLIPS)}, art arda değil.`,
    },
    memory: {
      workedEvening: "Dünkü tavsiye işe yaradı: akşam kaçamaksız geçti.",
      workedDay: "Dünkü tavsiye işe yaradı: gün kaçamaksız ve limit içinde geçti.",
      missed: [
        "Dün olmadı — bu normal. Bugün başka bir yoldan deneyelim.",
        "Dünkü tavsiye işe yaramadı, bunu bilmek de faydalı. Bugün farklı bir yaklaşım.",
      ],
    },
  },

  insights: {
    timeAfter: [
      (slips: number, total: number, time: string) =>
        `Son dört haftada ${total} kaçamaktan ${slips} tanesi ${time} sonrasında yaşandı.`,
      (slips: number, total: number, time: string) =>
        `Kaçamakların çoğu — son dört haftada ${total} kaçamaktan ${slips} tanesi — ${time} sonrasında başlıyor.`,
    ],
    timeWindow: (from: string, to: string, slips: number, total: number) =>
      `Kaçamaklar en sık ${from} ile ${to} arasında yaşanıyor: son dört haftada ${total} kaçamaktan ${slips} tanesi.`,
    topReason: [
      (cause: Cause, slips: number, total: number) =>
        `Son kaçamakların başlıca nedeni: ${cause.noun} (${total} kaçamaktan ${slips} tanesi).`,
      (cause: Cause, slips: number, total: number) =>
        `Son üç haftada kaçamaklar en çok ${cause.because} oldu: ${total} kaçamaktan ${slips} tanesi.`,
    ],
    recurringWeekday: (weeks: number, index: number) =>
      `Üst üste ${ordinal(weeks)} hafta: en zor günün yine ${day(index)}.`,
    hardWeekday: (index: number, bad: number, active: number) =>
      `En zor günün ${day(index)}: son ${active} ${day(index)} gününden ${bad} tanesi kaçamakla ya da limit aşımıyla geçti.`,
    calmWeekdayNone: (index: number, active: number) =>
      `${day(index)} günleri kaçamak riski çok düşük: son ${active} ${day(index)} gününün hiçbiri zor geçmedi.`,
    calmWeekday: (index: number, bad: number, active: number) =>
      `Kaçamaklar en az ${day(index)} günleri oluyor: son ${active} ${day(index)} gününden yalnızca ${bad} tanesi zor geçti.`,
    walksNoSlips: (walks: number) =>
      `Son dört haftada ${count(walks, WALKS)} yaptın — hiçbirinin ardından üç saat içinde kaçamak olmadı.`,
    walksFewSlips: (slipsAfter: number, walks: number) =>
      `Yürüyüşlerden sonra neredeyse hiç kaçamak olmuyor: ${walks} yürüyüşten yalnızca ${slipsAfter} tanesi üç saat içinde akışla bitti.`,
    replacementsNoSlips: (withoutRate: number) =>
      `En az bir alternatif yaptığın günlerde hiç kaçamak olmadı; alternatifsiz günlerin ise %${withoutRate} kadarı zor geçti.`,
    replacementsFewer: (withRate: number, withoutRate: number) =>
      `Alternatif yaptığın günler belirgin şekilde daha kolay: zor gün oranı %${withRate}, diğer günlerde %${withoutRate}.`,
    scrollDownSteady: (average: string, change: number) =>
      `Son iki hafta istikrarlı bir ilerleme: akış günde ortalama ${average} sürüyor, öncekinden %${change} daha az ve kaçamaklar artmadı.`,
    scrollDown: (average: string, change: number) =>
      `Son iki haftada akış günde ortalama ${average} sürüyor — önceki iki haftadan %${change} daha az.`,
    scrollUp: (recent: string, previous: string) =>
      `Son iki haftada akış arttı: günde ortalama ${recent}, önceden ${previous}.`,
    slipsDown: (recent: number, previous: number) =>
      `Kaçamaklar belirgin şekilde azaldı: son iki haftada ${recent}, öncesinde ${previous}.`,
    slipsUp: (recent: number, previous: number) =>
      `Son iki haftada kaçamaklar arttı: ${recent}, öncesinde ${previous}.`,
    eveningBetter: (time: string, recent: number, previous: number) =>
      `Akşamların bir ay öncesine göre daha iyi: bu ay ${time} sonrasında ${count(recent, SLIPS)}, önceki ay ${previous}.`,
    shorterSlips: (recent: string, previous: string) =>
      `Kaçamaklar kısaldı: ortalama ${recent}, iki hafta önce ${previous}.`,
    streakGap: (best: number, gap: number) =>
      `En iyi sonucuna — art arda ${count(best, DAYS)} — ${count(gap, DAYS)} kaldı.`,
    streakRecord: (value: number) =>
      `Şu an en uzun serindesin: art arda ${count(value, DAYS)} limit içinde.`,
  },

  advice: {
    earlySleep: [
      "Bugün yarım saat erken yatmayı dene ve telefonunu yatak odasının dışında şarj et.",
      "Bugün erken yatmak daha iyi: yorgun bir beyne akış hep iyi bir fikir gibi gelir, sabah ise hiç öyle gelmez.",
    ],
    phoneAway: [
      (time: string) =>
        `Bugün akşam yemeğinden sonra telefonunu en az 15 dakikalığına başka bir odaya bırak — özellikle saat ${time} civarında.`,
      (time: string) =>
        `Saat ${time} civarında telefonunu ekranı aşağı bakacak şekilde başka bir odaya bırak ve akşamı akış olmadan geçir.`,
    ],
    walkHelps: [
      "Yürüyüşlerden sonra neredeyse hiç kaçamak yaşamıyorsun. Bugün akış seni çektiğinde işe beş dakika dışarıda yürüyerek başla.",
      "Yürüyüşler sana iyi geliyor — veriler bunu gösteriyor. Bugün akış seni çektiğinde en az beş dakika yürüyüşe çık.",
    ],
    walkTry: (app: string | null) =>
      `Bugün ${app ?? "akış"} seni çektiğinde, onun yerine kısa bir yürüyüş dene.`,
    livingAlternative: [
      "Akışa “canlı” bir alternatifi göz önünde tut — bir kitap, bir defter, bir gitar. Can sıkıntısının ihtiyacı yenilik, sonsuz kaydırma değil.",
      "Can sıkıntısı anları için önceden bir şey hazırla: bir kitap sayfası, kısa bir bulmaca, bir telefon görüşmesi. Böylece akışın bir rakibi olur.",
    ],
    moveApps:
      "Akış uygulamalarını ana ekrandan kaldır. Otomatik pilot düşünceden hızlıdır — önüne bir adım daha koy.",
    moveApp: (app: string) =>
      `${app} uygulamasını telefonunun ana ekranından kaldır. Otomatik pilot düşünceden hızlıdır — önüne bir adım daha koy.`,
    breatheFirst: [
      "Bugün kaygı yükselirse önce uzun bir nefes ver ya da SOS molası yap. Akış kaçış vaat eder ama kaygı sonra geri gelir.",
      "Gerginlik arttığında akışı açmadan önce kendine 15 saniyelik bir SOS molası ver. Bu, bedenini videolardan daha hızlı sakinleştirir.",
    ],
    callSomeone:
      "Bugün yakın olduğun birine mesaj at. Gerçek bir sohbet, akıştaki başkalarının hayatından daha çok ısıtır.",
    tinyStep:
      "Bugün bir işi ertelemek istersen yalnızca iki dakikalık ilk adımı at. Akış çoğu zaman başlamamak için vardır.",
    realRest:
      "Bugün gerçekten hafifleten bir dinlenme seç: duş, gözler kapalı müzik ya da beş dakikalık esneme.",
    keepRhythmLogged: [
      "Bugün risk düşük — ritmini koru, yeter. Akış seni çekerse mola her zaman elinin altında.",
      "Bugün sakin bir gün. Kanıtlaman gereken bir şey yok — böyle devam et.",
    ],
    keepRhythm: [
      "Bugün risk düşük — ritmini koru, yeter. Akşam akış süreni kaydet ki seri devam etsin.",
      "Bugün sakin bir gün. Akşam akış süreni kaydetmeyi unutma — seri bu kayıtlarla sürüyor.",
    ],
    logLearning:
      "Her gün akışa ne kadar zaman gittiğini kaydet ve kaçamakları not et. Birkaç gün içinde alışkanlıkların hakkında somut konuşabileceğim.",
    logToday:
      "Bugün akışa ne kadar zaman gittiğini kaydet — böylece örüntüleri daha kolay görürüm.",
    sosReady: [
      "SOS molasını elinin altında tut: 15 saniye nefes — ve karar yeniden senin.",
      "Dürtü güçlü olursa SOS molasına dokun. Hiçbir şeyi yasaklamaz, sadece düşünmen için zaman tanır.",
    ],
    forWeek: (tip: string) => tip.replace(/Bugün /g, "Bu hafta ").replace(/bugün /g, "bu hafta "),
  },

  replacement: {
    helped: (times: number) =>
      `Şimdiden ${count(times, TIMES)} işe yaradı: ardından kaçamak olmadı.`,
    matches: (cause: Cause) => `En sık yaşadığın nedene uygun: ${cause.noun}.`,
    lastTime: "Geçen sefer ardından kaçamak olmadı.",
  },

  reflection: {
    understanding: {
      boredom: "Can sıkıntısı, elin akışa uzanmasının en yaygın nedenlerinden biri.",
      fatigue: "Güç kalmadığında beyin en kolayını seçer — akış da hep elinin altında.",
      relax: "Dinlenmek istemek normal. Sadece akış, ondan umduğun dinlenmeyi nadiren verir.",
      sleepless:
        "Uyuyamadığında ekran bir kurtuluş gibi görünür ama çoğu zaman uykuyu yalnızca öteler.",
      autopilot:
        "Otomatik pilot düşünceden önce devreye girer — bu bir alışkanlık, zayıflık değil.",
      stress: "Kaygılı olduğunda akış bir nefes molası vaat eder. Elin ona uzanması çok anlaşılır.",
      loneliness:
        "Yalnız hissettiğinde akıştaki başkalarının hayatı kısa bir süre arkadaşlık hissi verir.",
      procrastination:
        "Akış çoğu zaman zor bir işe başlamamaya yardım eder. Bu herkesin başına gelir.",
      other: "Ne olduğunu anlamaya çalışmak zaten faydalı bir adım.",
    },
    nextTime: {
      boredom:
        "Bir dahaki sefere önce kısa bir alternatif dene — can sıkıntısının ihtiyacı yenilik.",
      fatigue: "Bugün iradeyle dayanmaktansa erken yatmak daha iyi.",
      relax: "Bir dahaki sefere ekransız dinlenmeyi dene — en az beş dakika.",
      sleepless: "Yine uyuyamazsan ışığı kıs ve telefonu yataktan uzağa koy.",
      autopilot:
        "Sürtünme işe yarar: uygulamayı ana ekrandan kaldır, otomatik pilotun işi zorlaşsın.",
      stress:
        "Bir dahaki sefere uzun bir nefes verişle ya da SOS molasıyla başla — beden daha hızlı sakinleşir.",
      loneliness: "Bir dahaki sefere gerçek birine yazmayı dene — bu daha uzun süre ısıtır.",
      procrastination:
        "Bir dahaki sefere işe iki dakikalık bir adımla başla — gerisi genelde daha kolay gelir.",
      other: "İstersen birkaç kelime ekle — böylece neyin tekrarlandığını fark etmek kolaylaşır.",
    },
    thanksForNote: "Kendi kelimelerinle anlattığın için teşekkürler — bunu aklımda tutacağım.",
    noted: "Bunu aklımda tutacağım.",
    repeated: (times: number, cause: Cause) =>
      `İki hafta içinde ${ordinal(times)} kez: neden yine ${cause.noun}.`,
    twice: "Benzeri birkaç gün önce de oldu — bunu aklımda tutacağım.",
    first:
      "Bunu aklımda tutacağım: notların ne kadar dürüst olursa tavsiyelerim o kadar isabetli olur.",
    lateEvening: (cause: Cause) =>
      `Geç saat ve ${cause.noun}: akışın neredeyse her zaman kazandığı bir ikili.`,
    close: [
      "Bir kaçamak hiçbir şeyi silmez.",
      "Bu yalnızca bir an, günün özeti değil.",
      "Yarın yeni bir gün.",
    ],
  },

  review: {
    titles: {
      good: "Neler iyi gitti",
      worse: "Neler kötüleşti",
      habit: "Hangi alışkanlık iyileşti",
      weak: "Akış en çok nerede kazanıyor",
      next: "Gelecek hafta ne denenebilir",
    },
    savedMovies: (duration: string, movies: number) =>
      `Bu hafta sana ${duration} geri kazandırdı — ${movies === 1 ? "koca bir filme" : `${movies} filme`} yeter.`,
    saved: (duration: string) => `Bu hafta sana ${duration} geri kazandırdı.`,
    daysInLimit: (inLimit: number, logged: number) =>
      `${logged} günün ${inLimit} tanesi limit içinde geçti.`,
    fewerSlips: (now: number, before: number) =>
      `Kaçamaklar azaldı: ${now}, bir önceki hafta ${before}.`,
    impulses: (percent: number) => `Dürtülerin %${percent} kadarı akışa girmeden geçti.`,
    replacements: (replacements: number) => `Akış yerine ${count(replacements, ALTERNATIVES)}.`,
    noWins: [
      "Bu hafta belirgin kazanım az — ama artık neye dayanabileceğin görülüyor.",
      "Zor bir hafta oldu. Bu bir başarısızlık değil, veri: nerede önlem alınacağı şimdiden belli.",
    ],
    firstWeek: "Henüz karşılaştıracak bir şey yok — bu, kayıtların olduğu ilk hafta.",
    moreSlips: (now: number, before: number) => `Kaçamaklar arttı: ${now}, öncesinde ${before}.`,
    moreScroll: (now: string, before: string) =>
      `Akış günde ortalama ${now} sürdü, bir önceki hafta ${before}.`,
    heldLess: (now: number, before: number) =>
      `Direnmek daha az başarılı oldu: %${now}, öncesinde %${before}.`,
    nothingWorse: "Belirgin bir kötüleşme yok.",
    habitFirstWeek:
      "Henüz karşılaştıracak bir şey yok — bir hafta sonra burada değişimi göreceksin.",
    eveningHabit: (time: string, now: number, before: number) =>
      `Akşamlar: ${time} sonrasında ${count(now, SLIPS)}, bir önceki hafta ${before}.`,
    reasonHabit: (cause: Cause, now: number, before: number) =>
      `Daha az kaçamak: ${cause.noun} kaynaklı ${now}, bir önceki hafta ${before}.`,
    switchHabit: (now: number, before: number) =>
      `Başka bir şeye geçme alışkanlığı güçleniyor: ${count(now, ALTERNATIVES)}, bir önceki hafta ${before}.`,
    scrollHabit: (now: string, before: string) =>
      `Akış süresi azaldı: günde ${now}, öncesinde ${before}.`,
    noHabit: "Henüz hiçbir alışkanlık belirgin şekilde değişmedi — tek bir hafta için bu normal.",
    noWeakSpots: "Zayıf nokta görünmüyor: hafta boyunca tek bir kaçamak bile yok.",
    singleSlip: (index: number, time: string, cause: Cause | null) =>
      `Tek bir kaçamak oldu — ${day(index)} günü saat ${time} civarında${cause ? `, ${cause.because}` : ""}.`,
    hardest: (index: number | null, time: string | null, cause: Cause | null) => {
      const where = [index !== null ? `${day(index)} günü` : null, time && `saat ${time} civarında`]
        .filter(Boolean)
        .join(" ");
      const why = cause ? ` — genelde ${cause.because}` : "";
      return where
        ? `En çok ${where} zorlandın${why}.`
        : `Zor anlar farklı saatlere dağıldı${why}.`;
    },
    goal: (tip: string, target: number) =>
      `${tip} Küçük bir hedef de: 7 günün ${target} tanesi limit içinde.`,
    logDaily: (tip: string) =>
      `${tip} Bir de akış süreni her gün kaydetmeyi dene — böylece bir sonraki değerlendirme daha isabetli olur.`,
  },

  ui: {
    badge: "Kişisel koçunuz",
    briefing: {
      learningCaption: "Alışkanlıklarını tanıyorum",
      caption: "Bugünün özeti",
      learning: (needed: number) =>
        `Henüz bilgi topluyorum — kayıtlı ${count(needed, DAYS)} olduğunda tahmin görünecek.`,
      progress: (active: number, needed: number) =>
        `Kayıtlı günler: ${active} / ${needed}. Her şey sayılır: akış süresi, SOS molası, alternatif ya da kaçamak.`,
      riskTitle: "Bugün kontrolsüz kaydırma riski",
      riskA11y: (level: string) => `Bugün kontrolsüz kaydırma riski: ${level}`,
      riskLevels: { low: "Düşük", medium: "Orta", high: "Yüksek" },
      why: "Neden: ",
      adviceTitle: "Bugünün tavsiyesi",
      start: (title: string) => `Başlat: ${title}`,
    },
    insightsTitle: "Kayıtlar ne gösteriyor",
    reflection: {
      title: "Ne oldu?",
      subtitle: "Yargı yok — yalnızca neyin tekrarlandığını görmek için.",
      replyTitle: "Anlıyorum",
      placeholder: "Ya da kendi kelimelerinizle — isteğe bağlı",
      noteA11y: "Ne oldu, kendi kelimelerinizle",
      done: "Tamam",
      notNow: "Şimdi değil",
      tryReplacement: (title: string) => `Deneyin: ${title}`,
      thanks: "Teşekkürler",
    },
    weeklyCaption: "Haftanın değerlendirmesi",
  },
};
