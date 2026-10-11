import { Platform } from "react-native";

const APPLE_STANDARD_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

/**
 * Links App Store / Google Play require next to subscription offers. On iOS Apple's standard EULA
 * is a valid Terms of Use; elsewhere the link is shown only when a URL is configured. The privacy
 * policy falls back to the in-app screen until a hosted URL is set.
 * Each variable is referenced literally so Expo can inline it at build time.
 */
export const TERMS_URL: string | null =
  process.env.EXPO_PUBLIC_TERMS_URL?.trim() || (Platform.OS === "ios" ? APPLE_STANDARD_EULA : null);

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || null;
