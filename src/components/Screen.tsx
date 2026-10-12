import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useContext, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "../utils/cn";
import { FLOATING_TAB_BAR_SPACE } from "./FloatingTabBar";

interface ScreenProps {
  children: ReactNode;
  /** Set to false when the screen renders its own list (e.g. FlatList). */
  scroll?: boolean;
  contentClassName?: string;
}

export function Screen({ children, scroll = true, contentClassName }: ScreenProps) {
  const insets = useSafeAreaInsets();
  // Tab screens scroll under the floating tab bar, so they need room to clear it.
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const top = insets.top + 8;
  const bottom = inTabs ? insets.bottom + FLOATING_TAB_BAR_SPACE : insets.bottom + 24;

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
        contentContainerStyle={{ paddingTop: top, paddingBottom: bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className={cn("gap-3 px-4", contentClassName)}>{children}</View>
      </ScrollView>
    </View>
  );
}
