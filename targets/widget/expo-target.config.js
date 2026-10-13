/**
 * Home and Lock Screen widgets. The app writes a small JSON snapshot of real numbers into the
 * shared App Group (src/widgets/snapshot.ts); the widgets only read it.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: "widget",
  name: "StopScrollWidget",
  displayName: "StopScroll",
  deploymentTarget: "17.0",
  colors: {
    $widgetBackground: { light: "#FFFFFF", dark: "#1C1C1E" },
    $accent: { light: "#007AFF", dark: "#0A84FF" },
    brand: { light: "#007AFF", dark: "#0A84FF" },
    success: { light: "#248A3D", dark: "#30D158" },
    warning: { light: "#F25C05", dark: "#FF7A1A" },
    indigo: { light: "#5856D6", dark: "#5E5CE6" },
    track: { light: "#E5E5EA", dark: "#2C2C2E" },
  },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
