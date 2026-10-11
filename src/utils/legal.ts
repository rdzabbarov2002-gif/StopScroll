/**
 * Links App Store / Google Play require next to subscription offers. Apple's standard EULA is a
 * valid Terms of Use; the privacy policy falls back to the in-app screen until a hosted URL is set.
 * Each variable is referenced literally so Expo can inline it at build time.
 */
export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL?.trim() ||
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || null;
