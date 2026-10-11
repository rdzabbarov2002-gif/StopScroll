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
- `src/navigation/RootNavigator.tsx` is the root native stack: `Onboarding` (until onboarded), `Main` (the tabs), and the full-screen modals `Intercept`, `Replacement`, `Paywall`, plus `Settings`. Tabs live in `src/navigation/RootTabs.tsx`; all route params are typed in `src/navigation/types.ts`.

## Project conventions

- Global state: `src/context/AppContext.tsx` (provider + `useApp()`), pure reducer in `src/context/appReducer.ts`. Everything in `PersistedState` is saved to AsyncStorage under one key; `src/utils/persistedState.ts` sanitizes whatever is loaded.
- Subscriptions: `src/context/ProContext.tsx` (`usePro()`) wraps RevenueCat via `src/services/purchases.ts`. Gate Pro features with `isPro`; Free/Pro limits live in `src/utils/pro.ts` so screens and the paywall stay in sync. Locked UI opens `navigation.navigate("Paywall", { feature })`.
- Content (triggers, replacements, SOS exercises, time equivalents) is data in `src/utils/catalog.ts`; stats and analytics are pure functions in `src/utils/stats.ts` and `src/utils/analytics.ts` — keep them pure and covered by tests.
- Styling: NativeWind v4 (Tailwind 3) with `darkMode: "class"`; brand color is `brand-*` (indigo). Always pair light and `dark:` classes. Colors needed in JS (icons, navigation, SVG) come from `useThemeColors()` in `src/utils/theme.ts`; chart colors come from its `chart` palette (the resisted/slip pair was CVD-validated — keep it).
- `Animated.View` is not wrapped by NativeWind: style it with `style`, put `className` on an inner `View`.
- Native dependency versions are pinned to `node_modules/expo/bundledNativeModules.json` for the current SDK.
- Checks: `npm run typecheck`, `npm run lint`, `npm test`.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a native build: `npx expo run:ios|android` locally, or `eas build --profile preview` (eas.json has `preview` and `production`; add `expo-dev-client` and a `development` profile if you need a dev client).
- Real App Store / Google Play purchases need a native build; in Expo Go and on the web RevenueCat runs in browser mode with a Test Store key.
- `plugins/withSingleTopActivity.js` sets the Android main activity to `singleTop`, as RevenueCat requires — keep it in `app.json` plugins.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
