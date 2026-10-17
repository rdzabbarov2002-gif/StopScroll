import { useNavigation } from "@react-navigation/native";
import { Linking, Pressable, View } from "react-native";

import { useT } from "../i18n";
import { cn } from "../utils/cn";
import { PRIVACY_URL, TERMS_URL } from "../utils/legal";
import { AppText } from "./AppText";

/** "Условия использования · Политика конфиденциальности" — required beside subscription offers. */
export function LegalLinks({ className }: { className?: string }) {
  const t = useT();
  const navigation = useNavigation();
  const termsUrl = TERMS_URL;

  const openPrivacy = () => {
    if (PRIVACY_URL) {
      Linking.openURL(PRIVACY_URL).catch(() => navigation.navigate("Privacy"));
    } else {
      navigation.navigate("Privacy");
    }
  };

  return (
    <View className={cn("flex-row flex-wrap items-center justify-center gap-x-2", className)}>
      {termsUrl ? (
        <>
          <LinkText
            label={t.privacy.links.terms}
            onPress={() => Linking.openURL(termsUrl).catch(() => undefined)}
          />
          <AppText variant="caption" tone="subtle" className="text-xs">
            ·
          </AppText>
        </>
      ) : null}
      <LinkText label={t.privacy.links.privacy} onPress={openPrivacy} />
    </View>
  );
}

function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      hitSlop={8}
      className="py-1 active:opacity-60"
    >
      <AppText variant="caption" tone="primary" className="text-xs font-semibold underline">
        {label}
      </AppText>
    </Pressable>
  );
}
