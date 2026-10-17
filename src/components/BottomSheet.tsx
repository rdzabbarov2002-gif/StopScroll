import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useT } from "../i18n";
import { AppText } from "./AppText";
import { IconButton } from "./IconButton";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Modal card that rises from the bottom of the screen over a dimmed backdrop. */
export function BottomSheet({ visible, onClose, title, subtitle, children }: BottomSheetProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [offset] = useState(() => new Animated.Value(48));

  useEffect(() => {
    if (!visible) return;
    offset.setValue(48);
    Animated.timing(offset, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [visible, offset]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          className="absolute inset-0 bg-slate-950/50"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.closeSheet}
        />
        <Animated.View style={{ transform: [{ translateY: offset }], maxHeight: "92%" }}>
          <View
            className="rounded-t-4xl bg-white dark:bg-ink-900"
            style={{ paddingBottom: insets.bottom + 12 }}
            accessibilityViewIsModal
          >
            <View className="items-center pt-3">
              <View className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-ink-700" />
            </View>
            <View className="flex-row items-start justify-between gap-4 px-6 pb-2 pt-4">
              <View className="flex-1 gap-1">
                <AppText variant="heading" className="text-xl" accessibilityRole="header">
                  {title}
                </AppText>
                {subtitle ? (
                  <AppText variant="caption" tone="muted">
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
              <IconButton
                icon="close"
                onPress={onClose}
                accessibilityLabel={t.common.close}
                size={18}
              />
            </View>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
