import Foundation

/// Real numbers written by the app (src/widgets/snapshot.ts) into the shared App Group.
struct Snapshot: Codable {
  struct Replacement: Codable, Hashable {
    let id: String
    let title: String
    let minutes: Int
    /// "body", "mind" or "facts".
    let category: String
  }

  /// The local day ("YYYY-MM-DD") the "today" numbers belong to.
  let day: String
  let savedToday: Int
  let winsToday: Int
  let streak: Int
  /// The streak tomorrow if nothing is logged: today counts only once it is logged.
  let streakTomorrow: Int
  let limit: Int
  /// Logged feed minutes today; nil when today isn't logged yet.
  let scrolledToday: Int?
  let replacements: [Replacement]

  static let appGroup = "group.app.stopscroll.mobile"
  static let key = "widget.snapshot"

  static func load() -> Snapshot? {
    guard
      let json = UserDefaults(suiteName: appGroup)?.string(forKey: key),
      let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }

  static func dayKey(_ date: Date) -> String {
    let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
  }

  /// The numbers as they stand at `date`: a snapshot from yesterday means nothing happened yet today.
  func values(at date: Date) -> DayValues {
    let today = Snapshot.dayKey(date)
    if day == today {
      return DayValues(
        saved: savedToday, wins: winsToday, streak: streak, scrolled: scrolledToday, limit: limit)
    }
    let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: date).map(Snapshot.dayKey)
    return DayValues(
      saved: 0, wins: 0, streak: day == yesterday ? streakTomorrow : 0, scrolled: nil, limit: limit)
  }

  /// Shown only in the widget gallery before the app has ever written real numbers.
  static let gallery = Snapshot(
    day: dayKey(Date()), savedToday: 45, winsToday: 3, streak: 5, streakTomorrow: 5, limit: 60,
    scrolledToday: 40,
    replacements: [Replacement(id: "squats", title: "15 приседаний", minutes: 1, category: "body")])
}

struct DayValues {
  let saved: Int
  let wins: Int
  let streak: Int
  let scrolled: Int?
  let limit: Int

  /// Minutes left within today's limit (negative when it is exceeded).
  var left: Int? { scrolled.map { limit - $0 } }
}

/// Russian plural form: plural(5, ("день", "дня", "дней")) → "дней".
func plural(_ count: Int, _ forms: (String, String, String)) -> String {
  let n = abs(count) % 100
  let last = n % 10
  if n > 10 && n < 20 { return forms.2 }
  if last > 1 && last < 5 { return forms.1 }
  if last == 1 { return forms.0 }
  return forms.2
}

/// "45 мин", "1 ч 20 мин" split into number/unit pairs for big rounded numbers.
func durationParts(_ minutes: Int) -> [(String, String)] {
  let total = max(0, minutes)
  let hours = total / 60
  let rest = total % 60
  if hours == 0 { return [("\(rest)", "мин")] }
  if rest == 0 { return [("\(hours)", "ч")] }
  return [("\(hours)", "ч"), ("\(rest)", "мин")]
}

func durationText(_ minutes: Int) -> String {
  durationParts(minutes).map { "\($0.0) \($0.1)" }.joined(separator: " ")
}
