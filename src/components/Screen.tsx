import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "../utils/cn";

interface ScreenProps {
  children: ReactNode;
  /** Set to false when the screen renders its own list (e.g. FlatList). */
  scroll?: boolean;
  contentClassName?: string;
}

export function Screen({ children, scroll = true, contentClassName }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const top = insets.top + 12;

  if (!scroll) {
    return (
      <View className="flex-1 bg-canvas dark:bg-ink-950" style={{ paddingTop: top }}>
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas dark:bg-ink-950">
      <ScrollView
        contentContainerStyle={{ paddingTop: top, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className={cn("gap-5 px-5", contentClassName)}>{children}</View>
      </ScrollView>
    </View>
  );
}
