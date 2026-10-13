import AppIntents
import Foundation

/// The feed apps StopScroll can pause before; raw values match the app's own ids.
enum FeedApp: String, AppEnum {
  case tiktok
  case reels
  case shorts

  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Приложение"
  static let caseDisplayRepresentations: [FeedApp: DisplayRepresentation] = [
    .tiktok: "TikTok",
    .reels: "Instagram",
    .shorts: "YouTube",
  ]
}

/// First step of the "When TikTok is opened" automation. Answers "yes" when StopScroll should
/// show its pause, "no" for a few minutes after the user chose "open anyway" or when the pause
/// is turned off for this app in StopScroll.
struct ShouldPauseIntent: AppIntent {
  static let title: LocalizedStringResource = "Нужна пауза перед лентой?"
  static let description = IntentDescription(
    "Отвечает «Да», если перед приложением нужно показать паузу StopScroll. В автоматизации добавьте после него «Если» и «Открыть URL»."
  )
  static let openAppWhenRun: Bool = false

  @Parameter(title: "Приложение", default: .tiktok)
  var app: FeedApp

  static var parameterSummary: some ParameterSummary {
    Summary("Нужна пауза перед \(\.$app)?")
  }

  func perform() async throws -> some IntentResult & ReturnsValue<Bool> {
    let defaults = UserDefaults(suiteName: "group.app.stopscroll.mobile")
    // Written by the app (src/services/appGate.ios.ts); every app is paused until it says otherwise.
    let enabled = (defaults?.string(forKey: "gate.apps") ?? "tiktok,reels,shorts")
      .split(separator: ",")
      .map(String.init)
    let allowedUntil = defaults?.integer(forKey: "gate.allowedUntil.\(app.rawValue)") ?? 0
    let now = Int(Date().timeIntervalSince1970 * 1000)
    return .result(value: enabled.contains(app.rawValue) && now >= allowedUntil)
  }
}

@main
struct StopScrollIntentsExtension: AppIntentsExtension {}
