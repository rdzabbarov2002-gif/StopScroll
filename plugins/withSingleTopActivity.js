// RevenueCat recommends `singleTop` (or `standard`) for the main activity: with Expo's default
// `singleTask`, returning to the app from the launcher during a Play purchase (e.g. after 3-D Secure
// confirmation in a banking app) destroys the billing activity and the purchase is reported as
// cancelled.
const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

module.exports = function withSingleTopActivity(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(modConfig.modResults);
    mainActivity.$["android:launchMode"] = "singleTop";
    return modConfig;
  });
};
