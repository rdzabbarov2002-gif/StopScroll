import SwiftUI
import WidgetKit

// MARK: - Timelines

struct DayEntry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot?

  /// The snapshot's language; the device's before the app has written one.
  var strings: Strings { Strings(lang: snapshot?.lang ?? .device) }
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
  let lang: Lang

  var strings: Strings { Strings(lang: lang) }
}

/// A different replacement every half hour, picked from the ones open to the user.
struct ReplacementProvider: TimelineProvider {
  private static let slot: TimeInterval = 30 * 60

  func placeholder(in context: Context) -> ReplacementEntry {
    let gallery = Snapshot.gallery
    return ReplacementEntry(date: Date(), replacement: gallery.replacements.first, lang: gallery.lang)
  }

  func getSnapshot(in context: Context, completion: @escaping (ReplacementEntry) -> Void) {
    let snapshot = Snapshot.load() ?? (context.isPreview ? .gallery : nil)
    let items = snapshot?.replacements ?? []
    completion(
      ReplacementEntry(
        date: Date(), replacement: Self.pick(items, at: Date()), lang: snapshot?.lang ?? .device))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ReplacementEntry>) -> Void) {
    let now = Date()
    let snapshot = Snapshot.load()
    let items = snapshot?.replacements ?? []
    let lang = snapshot?.lang ?? .device
    let start = (now.timeIntervalSince1970 / Self.slot).rounded(.down) * Self.slot
    let entries = (0..<12).map { index -> ReplacementEntry in
      let date = index == 0 ? now : Date(timeIntervalSince1970: start + Double(index) * Self.slot)
      return ReplacementEntry(date: date, replacement: Self.pick(items, at: date), lang: lang)
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
  let strings: Strings
  let minutes: Int
  let color: Color
  var size: CGFloat = 34

  var body: some View {
    HStack(alignment: .firstTextBaseline, spacing: 3) {
      ForEach(Array(strings.durationParts(minutes).enumerated()), id: \.offset) { _, part in
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
  let strings: Strings

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      WidgetLabel(icon: "pause.circle.fill", title: "StopScroll", color: Color("brand"))
      Spacer(minLength: 0)
      Text(strings.empty)
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
    let s = entry.strings
    Group {
      if let snapshot = entry.snapshot {
        let values = snapshot.values(at: entry.date)
        if family == .accessoryRectangular {
          VStack(alignment: .leading, spacing: 1) {
            Label(s.savedTodayLabel, systemImage: "leaf.fill").font(.system(size: 12, weight: .semibold))
            Text(s.duration(values.saved)).font(roundedNumber(22))
            Text(s.winCount(values.wins))
              .font(.system(size: 12))
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        } else {
          VStack(alignment: .leading, spacing: 2) {
            WidgetLabel(icon: "leaf.fill", title: s.savedLabel, color: Color("success"))
            Spacer(minLength: 0)
            Text(s.todayCaption).font(.system(size: 13, weight: .medium)).foregroundStyle(.secondary)
            DurationView(strings: s, minutes: values.saved, color: Color("success"))
            Text(values.wins > 0 ? s.winsOverFeed(values.wins) : s.noWins)
              .font(.system(size: 12))
              .foregroundStyle(.secondary)
              .lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
      } else {
        EmptyWidgetView(strings: s)
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
    .configurationDisplayName(Strings.saved.todayName)
    .description(Strings.saved.todayDescription)
    .supportedFamilies([.systemSmall, .accessoryRectangular])
  }
}

// MARK: - "Серия"

struct StreakView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DayEntry

  var body: some View {
    let s = entry.strings
    Group {
      if let snapshot = entry.snapshot {
        let streak = snapshot.values(at: entry.date).streak
        if family == .accessoryCircular {
          ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: -2) {
              Image(systemName: "flame.fill").font(.system(size: 12, weight: .semibold))
              Text("\(streak)").font(roundedNumber(22))
              Text(s.days(streak)).font(.system(size: 10, weight: .medium))
            }
          }
        } else {
          VStack(alignment: .leading, spacing: 2) {
            WidgetLabel(icon: "flame.fill", title: s.streakLabel, color: Color("warning"))
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
              Text("\(streak)").font(roundedNumber(44))
              Text(s.days(streak)).font(.system(size: 17, weight: .semibold))
            }
            .foregroundStyle(Color("warning"))
            .lineLimit(1)
            .minimumScaleFactor(0.6)
            Text(streak > 0 ? s.streakActive : s.streakStart)
              .font(.system(size: 12))
              .foregroundStyle(.secondary)
              .lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
      } else {
        EmptyWidgetView(strings: s)
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
    .configurationDisplayName(Strings.saved.streakName)
    .description(Strings.saved.streakDescription)
    .supportedFamilies([.systemSmall, .accessoryCircular])
  }
}

// MARK: - "Лимит"

struct LimitView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DayEntry

  var body: some View {
    let s = entry.strings
    Group {
      if let snapshot = entry.snapshot {
        let values = snapshot.values(at: entry.date)
        let left = values.left
        let headline: String = {
          guard let left else { return s.limitHeadline(s.duration(values.limit)) }
          return left >= 0 ? s.leftHeadline(s.duration(left)) : s.overHeadline(s.duration(-left))
        }()
        let caption = left == nil ? s.logToday : s.ofToday(s.duration(values.limit))
        if family == .accessoryRectangular {
          VStack(alignment: .leading, spacing: 1) {
            Label(s.feedLimitLabel, systemImage: "hourglass").font(.system(size: 12, weight: .semibold))
            Text(headline).font(.system(size: 15, weight: .bold, design: .rounded)).lineLimit(1)
            Text(caption).font(.system(size: 12)).lineLimit(1)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        } else {
          let color = (left ?? 0) < 0 ? Color("warning") : Color("brand")
          VStack(alignment: .leading, spacing: 2) {
            WidgetLabel(icon: "hourglass", title: s.limitLabel, color: color)
            Spacer(minLength: 0)
            Text(left == nil ? s.limitToday : (left! >= 0 ? s.limitLeft : s.limitOver))
              .font(.system(size: 13, weight: .medium))
              .foregroundStyle(.secondary)
            DurationView(strings: s, minutes: left.map(abs) ?? values.limit, color: color)
            Text(caption).font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
      } else {
        EmptyWidgetView(strings: s)
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
    .configurationDisplayName(Strings.saved.limitName)
    .description(Strings.saved.limitDescription)
    .supportedFamilies([.systemSmall, .accessoryRectangular])
  }
}

// MARK: - Day ring

struct DayRingView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DayEntry

  var body: some View {
    let s = entry.strings
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
                Text(values.scrolled == nil ? "—" : s.duration(used))
                  .font(roundedNumber(17))
                  .minimumScaleFactor(0.6)
                  .lineLimit(1)
                Text(s.ringOf(s.duration(values.limit)))
                  .font(.system(size: 11))
                  .foregroundStyle(.secondary)
                  .lineLimit(1)
              }
              .padding(.horizontal, 14)
            }
            Text(values.scrolled == nil ? s.logTime : (over ? s.limitExceeded : s.feedToday))
              .font(.system(size: 12, weight: .semibold))
              .foregroundStyle(over ? Color("warning") : .secondary)
              .lineLimit(1)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
      } else {
        EmptyWidgetView(strings: s)
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
    .configurationDisplayName(Strings.saved.ringName)
    .description(Strings.saved.ringDescription)
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
    let s = entry.strings
    Group {
      if let item = entry.replacement {
        VStack(alignment: .leading, spacing: 4) {
          WidgetLabel(icon: "sparkles", title: s.insteadOfFeed, color: Color("indigo"))
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
              Text(s.replacementCaption(s.duration(item.minutes)))
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetURL(URL(string: "stopscroll://replacement/\(item.id)"))
      } else {
        EmptyWidgetView(strings: s)
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
    .configurationDisplayName(Strings.saved.replacementName)
    .description(Strings.saved.replacementDescription)
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
