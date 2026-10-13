/**
 * App Intents extension with the "Нужна пауза перед лентой?" Shortcuts action. A personal
 * automation ("When TikTok is opened") runs it first and only opens StopScroll's pause when it
 * answers yes — so "open anyway" doesn't bounce straight back into the pause.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: "app-intent",
  name: "StopScrollIntents",
  displayName: "StopScroll",
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
