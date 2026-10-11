import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "./AppText";

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {right}
    </View>
  );
}
