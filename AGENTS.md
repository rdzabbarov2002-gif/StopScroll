This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- This project uses **React Navigation** (`@react-navigation/native`, `native-stack`, `bottom-tabs`), not Expo Router. Do not add `expo-router` or an `src/app/` routes folder.
- `src/navigation/RootNavigator.tsx` is the root native stack: `Onboarding` (until onboarded), `Main` (the tabs), the full-screen modals `Intercept` (the SOS pause), `Replacement`, `Paywall`, `Privacy`, plus the pushed `Settings`, `WeeklyReport` and `Achievements`. Tabs (Главная, AI, Замены, Статистика, Дневник) live in `src/navigation/RootTabs.tsx`; all route params are typed in `src/navigation/types.ts`.
- Deep links (`stopscroll://pause`, `stopscroll://report`, widget taps) are mapped in `src/navigation/linking.ts`; linking is off on web so the preview's URL stays untouched.

## Project conventions

- Global state: `src/context/AppContext.tsx` (provider + `useApp()`), pure reducer in `src/context/appReducer.ts`. Everything in `PersistedState` is saved to AsyncStorage under one key; `src/utils/persistedState.ts` sanitizes whatever is loaded.
- Subscriptions: `src/context/ProContext.tsx` (`usePro()`) wraps RevenueCat via `src/services/purchases.ts`. Gate Pro features with `isPro`; Free/Pro limits live in `src/utils/pro.ts` so screens and the paywall stay in sync. Locked UI opens `navigation.navigate("Paywall", { feature })`.
- Content (triggers with their "Что произошло?" wording, replacements, SOS exercises, time equivalents, feed apps) is data in `src/utils/catalog.ts`; stats, analytics, the weekly report and achievements are pure functions in `src/utils/stats.ts`, `analytics.ts`, `weeklyReport.ts` and `achievements.ts` — keep them pure and covered by tests.
- The on-device coach lives in `src/coach`: pure, deterministic functions over the user's records (`history.ts` → `patterns.ts` → `insights.ts`, `briefing.ts`, `advice.ts`, `weeklyReview.ts`, `reflection.ts`, `replacement.ts`), covered by `src/coach/__tests__`. Every sentence must come from real numbers; when there is not enough data the coach says it is still learning instead of guessing. No randomness: wording varies only through `variant()` (a stable hash of the day). The coach speaks in the second person singular, gender-neutral (no past-tense verbs with a gender), calm, no exclamation marks. The UI calls it «Ваш персональный коуч»; it is shown on Home while ChatGPT is not connected. The AI tab and the consent texts name ChatGPT/OpenAI on purpose (disclosure of the third-party AI).
- The AI coach (ChatGPT) lives in `src/ai` + `src/context/AiContext.tsx` (`useAi()`), with its own storage keys (meta + one key per month of entries). All interpretation is the model's: never add keyword matching, regexes or rules that classify entries or invent conclusions locally. The app only does arithmetic over the history (`src/ai/facts.ts`), validates the shape of answers (`src/ai/parse.ts`) and decides *when* to call (`src/ai/schedule.ts`). The model keeps a compact memory that comes back with every `/insights` call — send new entries once, not the whole history. Nothing is sent before the user's consent (`consent === true`).
- `server/ai-coach` is a Cloudflare Worker with its own `package.json` (excluded from the app's tsconfig, ESLint and Jest) that calls OpenAI with the official `openai` SDK (Responses API, strict Structured Outputs; schemas in `src/schemas.ts`, prompts in `src/prompts.ts`). Keep the app's parsers in `src/ai/parse.ts` in sync with the schemas. The OpenAI key lives only in the Worker's secrets. Run `npm run typecheck` inside `server/ai-coach` after changing it.
- Optional rewording of the on-device coach: `src/services/coachVoice.ts` posts finished sentences to `/phrase`; `src/coach/phrasing.ts` rejects any rewording that changes numbers, times or weekdays.
- Native-only features use platform files: `sharedStorage.ios.ts`, `reportReminder.web.ts`, `src/widgets/sync.*` and `register.*`. Keep the default file's API identical; never import `react-native-android-widget` from code that runs on iOS or web (its TurboModule throws there).
- `src/services/NativeSync.tsx` pushes state out of JS (widget snapshot, Sunday reminder); `src/components/achievements/AchievementCenter.tsx` unlocks achievements and queues their animation (`unlockQueue` in the reducer, never persisted).
- Native code lives outside `ios/`/`android/`: `targets/widget` (Swift, linked by `@bacons/apple-targets`; the widget reads the JSON snapshot from App Group `group.app.stopscroll.mobile`). Keep `targets/widget/Snapshot.swift` in sync with `src/widgets/snapshot.ts`.
- Styling: NativeWind v4 (Tailwind 3) with `darkMode: "class"`. The look follows Apple Health: white (`bg-canvas`) or black (`dark:bg-ink-950`) pages, soft grey cards (`bg-card dark:bg-ink-900`, via `Card`), iOS system colors (`brand-*` is system blue; `slate`, `emerald`, `amber`, `rose` are remapped to iOS greys, green, orange and red in `tailwind.config.js`). Health-style cards use `CardLabel` + an `AppText variant="statement"` sentence; lists use `ListGroup`/`ListRow`; big numbers use `AppText rounded` (SF Pro Rounded on iOS). Always pair light and `dark:` classes. Colors needed in JS (icons, navigation, SVG) come from `useThemeColors()` in `src/utils/theme.ts`; chart colors come from its `chart` palette (blue ↔ orange for within ↔ over the limit; keep the pair distinct for color-blind users). Tab screens sit under the floating `FloatingTabBar`; `Screen` adds the bottom room automatically.
- `Animated.View` is not wrapped by NativeWind: style it with `style`, put `className` on an inner `View`.
- Native dependency versions are pinned to `node_modules/expo/bundledNativeModules.json` for the current SDK.
- Checks: `npm run typecheck`, `npm run lint`, `npm test` (and `npm run typecheck` in `server/ai-coach`).

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a native build: `npx expo run:ios|android` locally, or `eas build --profile preview` (eas.json has `preview` and `production`; add `expo-dev-client` and a `development` profile if you need a dev client).
- Real App Store / Google Play purchases need a native build; in Expo Go and on the web RevenueCat runs in browser mode with a Test Store key.
- `plugins/withSingleTopActivity.js` sets the Android main activity to `singleTop`, as RevenueCat requires — keep it in `app.json` plugins.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
