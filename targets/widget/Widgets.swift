import SwiftUI
import WidgetKit

// MARK: - Timelines

struct DayEntry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot?
}

/// Today's numbers, refreshed at local midnight so "today" never shows yesterday's values.
/// The app also reloads the widgets whenever its data changes.
struct DayProvider: TimelineProvider {
  func placeholder(in context: Context) -> DayEntry {
    DayEntry(date: Date(), snapshot: .gallery)
  }

  func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
    let snapshot = Snapshot.load() ?? (context.isPreview ? .gallery : nil)
    completion(DayEntry(date: Date(), snapshot: snapshot))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
    let now = Date()
    let snapshot = Snapshot.load()
    let calendar = Calendar.current
    let midnight =
      calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now))
      ?? now.addingTimeInterval(24 * 60 * 60)
    let entries = [DayEntry(date: now, snapshot: snapshot), DayEntry(date: midnight, snapshot: snapshot)]
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct ReplacementEntry: TimelineEntry {
  let date: Date
  let replacement: Snapshot.Replacement?
}

/// A different replacement every half hour, picked from the ones open to the user.
struct ReplacementProvider: TimelineProvider {
  private static let slot: TimeInterval = 30 * 60

  func placeholder(in context: Context) -> ReplacementEntry {
    ReplacementEntry(date: Date(), replacement: Snapshot.gallery.replacements.first)
  }

  func getSnapshot(in context: Context, completion: @escaping (ReplacementEntry) -> Void) {
    let items = Snapshot.load()?.replacements ?? (context.isPreview ? Snapshot.gallery.replacements : [])
    completion(ReplacementEntry(date: Date(), replacement: Self.pick(items, at: Date())))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ReplacementEntry>) -> Void) {
    let now = Date()
    let items = Snapshot.load()?.replacements ?? []
    let start = (now.timeIntervalSince1970 / Self.slot).rounded(.down) * Self.slot
    let entries = (0..<12).map { index -> ReplacementEntry in
      let date = index == 0 ? now : Date(timeIntervalSince1970: start + Double(index) * Self.slot)
      return ReplacementEntry(date: date, replacement: Self.pick(items, at: date))
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }

  static func pick(_ items: [Snapshot.Replacement], at date: Date) -> Snapshot.Replacement? {
    guard !items.isEmpty else { return nil }
    let index = Int((date.timeIntervalSince1970 / slot).rounded(.down)) % items.count
    return items[index]
  }
}

// MARK: - Building blocks

private func roundedNumber(_ size: CGFloat) -> Font {
  .system(size: size, weight: .bold, design: .rounded)
}

/// "● Спасено" — the colored label at the top of a Health-style card.
struct WidgetLabel: View {
  let icon: String
  let title: String
  let color: Color

  var body: some View {
    Label(title, systemImage: icon)
      .font(.system(size: 13, weight: .semibold))
      .foregroundStyle(color)
      .lineLimit(1)
  }
}

/// "1 ч 20 мин" with big rounded numbers and small units.
struct DurationView: View {
  let minutes: Int
  let color: Color
  var size: CGFloat = 34

  var body: some View {
    HStack(alignment: .firstTextBaseline, spacing: 3) {
      ForEach(Array(durationParts(minutes).enumerated()), id: \.offset) { _, part in
        Text(part.0).font(roundedNumber(size))
        Text(part.1).font(.system(size: size * 0.45, weight: .semibold))
      }
    }
    .foregroundStyle(color)
    .minimumScaleFactor(0.6)
    .lineLimit(1)
  }
}

/// Before the app has written anything.
struct EmptyWidgetView: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      WidgetLabel(icon: "pause.circle.fill", title: "StopScroll", color: Color("brand"))
      Spacer(minLength: 0)
      Text("Откройте StopScroll, чтобы здесь появились ваши цифры.")
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(.secondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

extension View {
  /// The card background on the Home Screen; the system styles Lock Screen widgets itself.
  func widgetCard(_ family: WidgetFamily) -> some View {
    containerBackground(for: .widget) {
      switch family {
      case .accessoryCircular, .accessoryRectangular, .accessoryInline:
        Color.clear
      default:
        Color("$widgetBackground")
      }
    }
  }
}

// MARK: - "Сегодня спасено"

struct TodayView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DayEntry

  var body: some View {
    Group {
      if let snapshot = entry.snapshot {
        let values = snapshot.values(at: entry.date)
        if family == .accessoryRectangular {
          VStack(alignment: .leading, spacing: 1) {
            Label("Спасено сегодня", systemImage: "leaf.fill").font(.system(size: 12, weight: .semibold))
            Text(durationText(values.saved)).font(roundedNumber(22))
            Text("\(values.wins) \(plural(values.wins, ("победа", "победы", "побед")))")
              .font(.system(size: 12))
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        } else {
          VStack(alignment: .leading, spacing: 2) {
            WidgetLabel(icon: "leaf.fill", title: "Спасено", color: Color("success"))
            Spacer(minLength: 0)
            Text("Сегодня").font(.system(size: 13, weight: .medium)).foregroundStyle(.secondary)
            DurationView(minutes: values.saved, color: Color("success"))
            Text(
              values.wins > 0
                ? "\(values.wins) \(plural(values.wins, ("победа", "победы", "побед"))) над лентой"
                : "Пауза вернёт время"
            )
            .font(.system(size: 12))
            .foregroundStyle(.secondary)
            .lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
      } else {
        EmptyWidgetView()
      }
    }
    .widgetCard(family)
    .widgetURL(URL(string: "stopscroll://home"))
  }
}

struct TodayWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "StopScrollToday", provider: DayProvider()) { entry in
      TodayView(entry: entry)
    }
    .configurationDisplayName("Сегодня")
    .description("Сколько времени вы сегодня вернули себе.")
    .supportedFamilies([.systemSmall, .accessoryRectangular])
  }
}

// MARK: - "Серия"

struct StreakView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DayEntry

  var body: some View {
    Group {
      if let snapshot = entry.snapshot {
        let streak = snapshot.values(at: entry.date).streak
        if family == .accessoryCircular {
          ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: -2) {
              Image(systemName: "flame.fill").font(.system(size: 12, weight: .semibold))
              Text("\(streak)").font(roundedNumber(22))
              Text(plural(streak, ("день", "дня", "дней"))).font(.system(size: 10, weight: .medium))
            }
          }
        } else {
          VStack(alignment: .leading, spacing: 2) {
            WidgetLabel(icon: "flame.fill", title: "Серия", color: Color("warning"))
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
              Text("\(streak)").font(roundedNumber(44))
              Text(plural(streak, ("день", "дня", "дней"))).font(.system(size: 17, weight: .semibold))
            }
            .foregroundStyle(Color("warning"))
            .lineLimit(1)
            .minimumScaleFactor(0.6)
            Text(streak > 0 ? "в пределах лимита" : "Начните серию сегодня")
              .font(.system(size: 12))
              .foregroundStyle(.secondary)
              .lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
      } else {
        EmptyWidgetView()
      }
    }
    .widgetCard(family)
    .widgetURL(URL(string: "stopscroll://stats"))
  }
}

struct StreakWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "StopScrollStreak", provider: DayProvider()) { entry in
      StreakView(entry: entry)
    }
    .configurationDisplayName("Серия")
    .description("Сколько дней подряд вы держитесь в пределах лимита.")
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

// MARK: - "Лимит"

struct LimitView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DayEntry

  var body: some View {
    Group {
      if let snapshot = entry.snapshot {
        let values = snapshot.values(at: entry.date)
        let left = values.left
        let headline: String = {
          guard let left else { return "Лимит \(durationText(values.limit))" }
          return left >= 0 ? "Осталось \(durationText(left))" : "Сверх лимита \(durationText(-left))"
        }()
        let caption = left == nil ? "Отметьте время за сегодня" : "из \(durationText(values.limit)) на сегодня"
        if family == .accessoryRectangular {
          VStack(alignment: .leading, spacing: 1) {
            Label("Лимит ленты", systemImage: "hourglass").font(.system(size: 12, weight: .semibold))
            Text(headline).font(.system(size: 15, weight: .bold, design: .rounded)).lineLimit(1)
            Text(caption).font(.system(size: 12)).lineLimit(1)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        } else {
          let color = (left ?? 0) < 0 ? Color("warning") : Color("brand")
          VStack(alignment: .leading, spacing: 2) {
            WidgetLabel(icon: "hourglass", title: "Лимит", color: color)
            Spacer(minLength: 0)
            Text(left == nil ? "Сегодня" : (left! >= 0 ? "Осталось" : "Сверх лимита"))
              .font(.system(size: 13, weight: .medium))
              .foregroundStyle(.secondary)
            DurationView(minutes: left.map(abs) ?? values.limit, color: color)
            Text(caption).font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
      } else {
        EmptyWidgetView()
      }
    }
    .widgetCard(family)
    .widgetURL(URL(string: "stopscroll://stats"))
  }
}

struct LimitWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "StopScrollLimit", provider: DayProvider()) { entry in
      LimitView(entry: entry)
    }
    .configurationDisplayName("Лимит")
    .description("Сколько ленты осталось на сегодня.")
    .supportedFamilies([.systemSmall, .accessoryRectangular])
  }
}

// MARK: - Day ring

struct DayRingView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DayEntry

  var body: some View {
    Group {
      if let snapshot = entry.snapshot {
        let values = snapshot.values(at: entry.date)
        let used = values.scrolled ?? 0
        let progress = values.limit > 0 ? min(1, Double(used) / Double(values.limit)) : (used > 0 ? 1 : 0)
        let over = used > values.limit
        if family == .accessoryCircular {
          Gauge(value: progress) {
            Image(systemName: "hourglass")
          } currentValueLabel: {
            Text(values.scrolled == nil ? "—" : "\(max(0, values.limit - used))")
              .font(roundedNumber(16))
          }
          .gaugeStyle(.accessoryCircularCapacity)
        } else {
          let color = over ? Color("warning") : Color("brand")
          VStack(spacing: 6) {
            ZStack {
              Circle().stroke(Color("track"), lineWidth: 11)
              Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: 11, lineCap: .round))
                .rotationEffect(.degrees(-90))
              VStack(spacing: 0) {
                Text(values.scrolled == nil ? "—" : durationText(used))
                  .font(roundedNumber(17))
                  .minimumScaleFactor(0.6)
                  .lineLimit(1)
                Text("из \(durationText(values.limit))")
                  .font(.system(size: 11))
                  .foregroundStyle(.secondary)
                  .lineLimit(1)
              }
              .padding(.horizontal, 14)
            }
            Text(values.scrolled == nil ? "Отметьте время" : (over ? "Лимит превышен" : "Лента сегодня"))
              .font(.system(size: 12, weight: .semibold))
              .foregroundStyle(over ? Color("warning") : .secondary)
              .lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
      } else {
        EmptyWidgetView()
      }
    }
    .widgetCard(family)
    .widgetURL(URL(string: "stopscroll://stats"))
  }
}

struct DayRingWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "StopScrollRing", provider: DayProvider()) { entry in
      DayRingView(entry: entry)
    }
    .configurationDisplayName("Прогресс дня")
    .description("Круг: сколько из дневного лимита ушло на ленту.")
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

// MARK: - Replacement

struct ReplacementView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ReplacementEntry

  private func icon(_ category: String) -> String {
    switch category {
    case "mind": return "brain.head.profile"
    case "facts": return "lightbulb.fill"
    default: return "figure.walk"
    }
  }

  var body: some View {
    Group {
      if let item = entry.replacement {
        VStack(alignment: .leading, spacing: 4) {
          WidgetLabel(icon: "sparkles", title: "Вместо ленты", color: Color("indigo"))
          Spacer(minLength: 0)
          HStack(alignment: .top, spacing: 10) {
            if family == .systemMedium {
              Image(systemName: icon(item.category))
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color("indigo")))
            }
            VStack(alignment: .leading, spacing: 2) {
              Text(item.title)
                .font(.system(size: family == .systemMedium ? 20 : 17, weight: .bold, design: .rounded))
                .lineLimit(3)
                .minimumScaleFactor(0.8)
              Text("\(item.minutes) мин · новая каждые полчаса")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetURL(URL(string: "stopscroll://replacement/\(item.id)"))
      } else {
        EmptyWidgetView()
      }
    }
    .widgetCard(family)
  }
}

struct ReplacementWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "StopScrollReplacement", provider: ReplacementProvider()) { entry in
      ReplacementView(entry: entry)
    }
    .configurationDisplayName("Полезная замена")
    .description("Короткое дело вместо ленты. Меняется каждые полчаса.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// MARK: - Bundle

@main
struct StopScrollWidgets: WidgetBundle {
  var body: some Widget {
    TodayWidget()
    StreakWidget()
    LimitWidget()
    DayRingWidget()
    ReplacementWidget()
  }
}
