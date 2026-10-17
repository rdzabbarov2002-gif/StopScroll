import Foundation

/// The app's languages (src/i18n/languages.ts). The widgets speak the one the app saved with
/// its last snapshot.
enum Lang: String {
  case ru, en, tr, de, fr

  /// The first of the device's preferred languages the app speaks, otherwise English.
  static var device: Lang {
    for identifier in Locale.preferredLanguages {
      if let lang = Lang(rawValue: String(identifier.prefix(2)).lowercased()) { return lang }
    }
    return .en
  }

  /// The language of the snapshot the app saved last; the device's before the app has saved any.
  static var saved: Lang { Snapshot.load()?.lang ?? device }
}

/// The forms of a word after a number. Russian uses all three (one: 1, 21; few: 2–4, 22–24;
/// many: 5–20, 25…); the other languages have one form for a single item and one for the rest.
struct Plural {
  let one: String
  let few: String
  let many: String

  init(one: String, few: String, many: String) {
    self.one = one
    self.few = few
    self.many = many
  }

  init(one: String, other: String) {
    self.init(one: one, few: other, many: other)
  }

  func form(_ count: Int, _ lang: Lang) -> String {
    let n = abs(count)
    switch lang {
    case .ru:
      let lastTwo = n % 100
      let last = n % 10
      if lastTwo > 10 && lastTwo < 20 { return many }
      if last > 1 && last < 5 { return few }
      if last == 1 { return one }
      return many
    case .fr:
      // French: 0 and 1 take the singular.
      return n < 2 ? one : many
    case .en, .tr, .de:
      return n == 1 ? one : many
    }
  }
}

/// Every text of the widgets in one language. The Home Screen ones match the Android widgets
/// (src/i18n/messages/widgets) — change both together; the Lock Screen and gallery texts are
/// iOS only. Units match the app's formatMinutes (src/i18n/messages/common).
struct Strings {
  let lang: Lang

  /// The texts for the gallery's widget names: the language the app saved last.
  static var saved: Strings { Strings(lang: Lang.saved) }

  private func pick<T>(ru: T, en: T, tr: T, de: T, fr: T) -> T {
    switch lang {
    case .ru: return ru
    case .en: return en
    case .tr: return tr
    case .de: return de
    case .fr: return fr
    }
  }

  // MARK: Numbers

  private var minuteUnit: String { pick(ru: "мин", en: "min", tr: "dk", de: "Min.", fr: "min") }
  private var hourUnit: String { pick(ru: "ч", en: "hr", tr: "sa", de: "Std.", fr: "h") }

  /// "45 мин", "1 ч 20 мин" split into number/unit pairs for big rounded numbers.
  func durationParts(_ minutes: Int) -> [(String, String)] {
    let total = max(0, minutes)
    let hours = total / 60
    let rest = total % 60
    if hours == 0 { return [("\(rest)", minuteUnit)] }
    if rest == 0 { return [("\(hours)", hourUnit)] }
    return [("\(hours)", hourUnit), ("\(rest)", minuteUnit)]
  }

  /// "45 мин", "1 ч 20 мин".
  func duration(_ minutes: Int) -> String {
    durationParts(minutes).map { "\($0.0) \($0.1)" }.joined(separator: " ")
  }

  /// The word after a number of days: "5 дней", "5 days".
  func days(_ count: Int) -> String {
    pick(
      ru: Plural(one: "день", few: "дня", many: "дней"),
      en: Plural(one: "day", other: "days"),
      tr: Plural(one: "gün", other: "gün"),
      de: Plural(one: "Tag", other: "Tage"),
      fr: Plural(one: "jour", other: "jours")
    ).form(count, lang)
  }

  private func wins(_ count: Int) -> String {
    pick(
      ru: Plural(one: "победа", few: "победы", many: "побед"),
      en: Plural(one: "win", other: "wins"),
      tr: Plural(one: "zafer", other: "zafer"),
      de: Plural(one: "Sieg", other: "Siege"),
      fr: Plural(one: "victoire", other: "victoires")
    ).form(count, lang)
  }

  /// "3 победы" — on the Lock Screen.
  func winCount(_ count: Int) -> String {
    "\(count) \(wins(count))"
  }

  // MARK: Before the app has written anything

  var empty: String {
    pick(
      ru: "Откройте StopScroll, чтобы здесь появились ваши цифры.",
      en: "Open StopScroll to see your numbers here.",
      tr: "Rakamlarınızın burada görünmesi için StopScroll’u açın.",
      de: "Öffnen Sie StopScroll, damit hier Ihre Zahlen erscheinen.",
      fr: "Ouvrez StopScroll pour voir vos chiffres ici.")
  }

  /// The replacement in the gallery preview (the "squats" one of the catalog).
  var galleryReplacement: String {
    pick(
      ru: "15 приседаний", en: "15 squats", tr: "15 squat", de: "15 Kniebeugen", fr: "15 squats")
  }

  // MARK: Today

  var todayName: String {
    pick(ru: "Сегодня", en: "Today", tr: "Bugün", de: "Heute", fr: "Aujourd’hui")
  }

  var todayDescription: String {
    pick(
      ru: "Сколько времени вы сегодня вернули себе.",
      en: "How much time you’ve won back today.",
      tr: "Bugün kendinize ne kadar zaman kazandırdınız.",
      de: "Wie viel Zeit Sie sich heute zurückgeholt haben.",
      fr: "Le temps que vous avez regagné aujourd’hui.")
  }

  var savedLabel: String {
    pick(ru: "Спасено", en: "Saved", tr: "Kurtarılan", de: "Gewonnen", fr: "Temps gagné")
  }

  /// The Lock Screen label.
  var savedTodayLabel: String {
    pick(
      ru: "Спасено сегодня", en: "Saved today", tr: "Bugün kurtarılan", de: "Heute gewonnen",
      fr: "Gagné aujourd’hui")
  }

  var todayCaption: String {
    pick(ru: "Сегодня", en: "Today", tr: "Bugün", de: "Heute", fr: "Aujourd’hui")
  }

  func winsOverFeed(_ count: Int) -> String {
    let word = wins(count)
    return pick(
      ru: "\(count) \(word) над лентой",
      en: "\(count) \(word) over the feed",
      tr: "Akışa karşı \(count) zafer",
      de: "\(count) \(word) über den Feed",
      fr: "\(count) \(word) sur le fil")
  }

  var noWins: String {
    pick(
      ru: "Пауза вернёт время",
      en: "A pause wins time back",
      tr: "Mola zaman kazandırır",
      de: "Eine Pause schenkt Zeit",
      fr: "Une pause rend du temps")
  }

  // MARK: Streak

  var streakName: String {
    pick(ru: "Серия", en: "Streak", tr: "Seri", de: "Serie", fr: "Série")
  }

  var streakDescription: String {
    pick(
      ru: "Сколько дней подряд вы держитесь в пределах лимита.",
      en: "How many days in a row you’ve stayed within your limit.",
      tr: "Kaç gündür art arda limit içinde kalıyorsunuz.",
      de: "Wie viele Tage in Folge Sie im Limit geblieben sind.",
      fr: "Combien de jours d’affilée vous restez dans la limite.")
  }

  var streakLabel: String { streakName }

  var streakActive: String {
    pick(
      ru: "в пределах лимита",
      en: "within your limit",
      tr: "limit içinde",
      de: "innerhalb des Limits",
      fr: "dans la limite")
  }

  var streakStart: String {
    pick(
      ru: "Начните серию сегодня",
      en: "Start a streak today",
      tr: "Seriye bugün başlayın",
      de: "Heute eine Serie starten",
      fr: "Démarrez une série")
  }

  // MARK: Limit

  var limitName: String {
    pick(ru: "Лимит", en: "Limit", tr: "Limit", de: "Limit", fr: "Limite")
  }

  var limitDescription: String {
    pick(
      ru: "Сколько ленты осталось на сегодня.",
      en: "How much feed time is left today.",
      tr: "Bugün akış için ne kadar süre kaldı.",
      de: "Wie viel Feed-Zeit heute noch übrig ist.",
      fr: "Le temps de fil qu’il vous reste aujourd’hui.")
  }

  var limitLabel: String { limitName }

  /// The Lock Screen label.
  var feedLimitLabel: String {
    pick(
      ru: "Лимит ленты", en: "Feed limit", tr: "Akış limiti", de: "Feed-Limit",
      fr: "Limite du fil")
  }

  /// Lock Screen headlines: today's limit, what is left of it, or how far it is exceeded.
  func limitHeadline(_ limit: String) -> String {
    pick(
      ru: "Лимит \(limit)", en: "Limit \(limit)", tr: "Limit \(limit)", de: "Limit \(limit)",
      fr: "Limite \(limit)")
  }

  func leftHeadline(_ left: String) -> String {
    pick(
      ru: "Осталось \(left)", en: "\(left) left", tr: "Kalan \(left)", de: "Noch \(left)",
      fr: "Il reste \(left)")
  }

  func overHeadline(_ over: String) -> String {
    pick(
      ru: "Сверх лимита \(over)",
      en: "\(over) over limit",
      tr: "Limit aşımı \(over)",
      de: "\(over) über dem Limit",
      fr: "Dépassement \(over)")
  }

  /// Above the big number: today's limit, what is left of it, or how far it is exceeded.
  var limitToday: String { todayCaption }

  var limitLeft: String {
    pick(ru: "Осталось", en: "Remaining", tr: "Kalan", de: "Noch übrig", fr: "Il reste")
  }

  var limitOver: String {
    pick(
      ru: "Сверх лимита", en: "Over limit", tr: "Limit aşımı", de: "Über dem Limit",
      fr: "Dépassement")
  }

  var logToday: String {
    pick(
      ru: "Отметьте время за сегодня",
      en: "Log today’s time",
      tr: "Bugünkü sürenizi kaydedin",
      de: "Zeit für heute eintragen",
      fr: "Notez le temps du jour")
  }

  func ofToday(_ limit: String) -> String {
    pick(
      ru: "из \(limit) на сегодня",
      en: "of \(limit) today",
      tr: "Bugünkü limit: \(limit)",
      de: "von \(limit) für heute",
      fr: "sur \(limit) aujourd’hui")
  }

  // MARK: Day ring

  var ringName: String {
    pick(
      ru: "Прогресс дня", en: "Day progress", tr: "Günün durumu", de: "Tagesfortschritt",
      fr: "Progression du jour")
  }

  var ringDescription: String {
    pick(
      ru: "Круг: сколько из дневного лимита ушло на ленту.",
      en: "A ring of how much of your daily limit went to the feed.",
      tr: "Halka: günlük limitin ne kadarı akışa gitti.",
      de: "Ein Ring: wie viel vom Tageslimit in den Feed ging.",
      fr: "Un anneau\u{00A0}: la part de la limite du jour passée sur le fil.")
  }

  /// Under the minutes in the middle of the ring.
  func ringOf(_ limit: String) -> String {
    pick(ru: "из \(limit)", en: "of \(limit)", tr: "/ \(limit)", de: "von \(limit)", fr: "sur \(limit)")
  }

  var logTime: String {
    pick(
      ru: "Отметьте время", en: "Log your time", tr: "Süreyi kaydedin", de: "Zeit eintragen",
      fr: "Notez le temps")
  }

  var limitExceeded: String {
    pick(
      ru: "Лимит превышен", en: "Limit exceeded", tr: "Limit aşıldı", de: "Limit überschritten",
      fr: "Limite dépassée")
  }

  var feedToday: String {
    pick(
      ru: "Лента сегодня", en: "Feed today", tr: "Bugünkü akış", de: "Feed heute",
      fr: "Fil du jour")
  }

  // MARK: Replacement

  var replacementName: String {
    pick(
      ru: "Полезная замена", en: "Healthy alternative", tr: "Faydalı alternatif",
      de: "Gute Alternative", fr: "Bonne alternative")
  }

  var replacementDescription: String {
    pick(
      ru: "Короткое дело вместо ленты. Меняется каждые полчаса.",
      en: "A quick thing to do instead of the feed. Changes every 30 minutes.",
      tr: "Akış yerine kısa bir uğraş. Her yarım saatte değişir.",
      de: "Eine kurze Sache statt Feed. Wechselt jede halbe Stunde.",
      fr: "Une petite activité au lieu du fil. Change toutes les 30 minutes.")
  }

  var insteadOfFeed: String {
    pick(
      ru: "Вместо ленты", en: "Instead of the feed", tr: "Akış yerine", de: "Statt Feed",
      fr: "Au lieu du fil")
  }

  func replacementCaption(_ duration: String) -> String {
    pick(
      ru: "\(duration) · новая каждые полчаса",
      en: "\(duration) · new every 30 min",
      tr: "\(duration) · her yarım saatte yeni",
      de: "\(duration) · alle 30 Min. neu",
      fr: "\(duration) · change toutes les 30 min")
  }
}
