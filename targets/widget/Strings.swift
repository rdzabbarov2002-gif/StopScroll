import Foundation

/// The app's languages (src/i18n/languages.ts). The widgets speak the one the app saved with
/// its last snapshot.
enum Lang: String {
  case ru, en

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
/// many: 5–20, 25…); English has one form for a single item and one for the rest.
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
    case .en:
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

  private func pick<T>(ru: T, en: T) -> T {
    switch lang {
    case .ru: return ru
    case .en: return en
    }
  }

  // MARK: Numbers

  private var minuteUnit: String { pick(ru: "мин", en: "min") }
  private var hourUnit: String { pick(ru: "ч", en: "hr") }

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
      en: Plural(one: "day", other: "days")
    ).form(count, lang)
  }

  private func wins(_ count: Int) -> String {
    pick(
      ru: Plural(one: "победа", few: "победы", many: "побед"),
      en: Plural(one: "win", other: "wins")
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
      en: "Open StopScroll to see your numbers here.")
  }

  /// The replacement in the gallery preview (the "squats" one of the catalog).
  var galleryReplacement: String {
    pick(ru: "15 приседаний", en: "15 squats")
  }

  // MARK: Today

  var todayName: String {
    pick(ru: "Сегодня", en: "Today")
  }

  var todayDescription: String {
    pick(ru: "Сколько времени вы сегодня вернули себе.", en: "How much time you’ve won back today.")
  }

  var savedLabel: String {
    pick(ru: "Спасено", en: "Saved")
  }

  /// The Lock Screen label.
  var savedTodayLabel: String {
    pick(ru: "Спасено сегодня", en: "Saved today")
  }

  var todayCaption: String {
    pick(ru: "Сегодня", en: "Today")
  }

  func winsOverFeed(_ count: Int) -> String {
    let word = wins(count)
    return pick(ru: "\(count) \(word) над лентой", en: "\(count) \(word) over the feed")
  }

  var noWins: String {
    pick(ru: "Пауза вернёт время", en: "A pause wins time back")
  }

  // MARK: Streak

  var streakName: String {
    pick(ru: "Серия", en: "Streak")
  }

  var streakDescription: String {
    pick(
      ru: "Сколько дней подряд вы держитесь в пределах лимита.",
      en: "How many days in a row you’ve stayed within your limit.")
  }

  var streakLabel: String { streakName }

  var streakActive: String {
    pick(ru: "в пределах лимита", en: "within your limit")
  }

  var streakStart: String {
    pick(ru: "Начните серию сегодня", en: "Start a streak today")
  }

  // MARK: Limit

  var limitName: String {
    pick(ru: "Лимит", en: "Limit")
  }

  var limitDescription: String {
    pick(ru: "Сколько ленты осталось на сегодня.", en: "How much feed time is left today.")
  }

  var limitLabel: String { limitName }

  /// The Lock Screen label.
  var feedLimitLabel: String {
    pick(ru: "Лимит ленты", en: "Feed limit")
  }

  /// Lock Screen headlines: today's limit, what is left of it, or how far it is exceeded.
  func limitHeadline(_ limit: String) -> String {
    pick(ru: "Лимит \(limit)", en: "Limit \(limit)")
  }

  func leftHeadline(_ left: String) -> String {
    pick(ru: "Осталось \(left)", en: "\(left) left")
  }

  func overHeadline(_ over: String) -> String {
    pick(ru: "Сверх лимита \(over)", en: "\(over) over limit")
  }

  /// Above the big number: today's limit, what is left of it, or how far it is exceeded.
  var limitToday: String { todayCaption }

  var limitLeft: String {
    pick(ru: "Осталось", en: "Remaining")
  }

  var limitOver: String {
    pick(ru: "Сверх лимита", en: "Over limit")
  }

  var logToday: String {
    pick(ru: "Отметьте время за сегодня", en: "Log today’s time")
  }

  func ofToday(_ limit: String) -> String {
    pick(ru: "из \(limit) на сегодня", en: "of \(limit) today")
  }

  // MARK: Day ring

  var ringName: String {
    pick(ru: "Прогресс дня", en: "Day progress")
  }

  var ringDescription: String {
    pick(
      ru: "Круг: сколько из дневного лимита ушло на ленту.",
      en: "A ring of how much of your daily limit went to the feed.")
  }

  /// Under the minutes in the middle of the ring.
  func ringOf(_ limit: String) -> String {
    pick(ru: "из \(limit)", en: "of \(limit)")
  }

  var logTime: String {
    pick(ru: "Отметьте время", en: "Log your time")
  }

  var limitExceeded: String {
    pick(ru: "Лимит превышен", en: "Limit exceeded")
  }

  var feedToday: String {
    pick(ru: "Лента сегодня", en: "Feed today")
  }

  // MARK: Replacement

  var replacementName: String {
    pick(ru: "Полезная замена", en: "Healthy alternative")
  }

  var replacementDescription: String {
    pick(
      ru: "Короткое дело вместо ленты. Меняется каждые полчаса.",
      en: "A quick thing to do instead of the feed. Changes every 30 minutes.")
  }

  var insteadOfFeed: String {
    pick(ru: "Вместо ленты", en: "Instead of the feed")
  }

  func replacementCaption(_ duration: String) -> String {
    pick(ru: "\(duration) · новая каждые полчаса", en: "\(duration) · new every 30 min")
  }
}
