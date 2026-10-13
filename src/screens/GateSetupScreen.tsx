import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { AppState, Switch, View } from "react-native";

import { AppText } from "../components/AppText";
import { BackButton } from "../components/BackButton";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ListGroup, ListRow } from "../components/ListGroup";
import { Screen } from "../components/Screen";
import { Stepper } from "../components/Stepper";
import { useApp } from "../context/AppContext";
import type { RootStackScreenProps } from "../navigation/types";
import { GATE_MODE, isGateServiceEnabled, openGateSystemSetup } from "../services/appGate";
import { GATE_ALLOW_MINUTES, GATE_APPS, type GateAppInfo } from "../utils/catalog";
import { haptics } from "../utils/haptics";
import { GATE_SECONDS_RANGE } from "../utils/persistedState";
import { useThemeColors, type ThemeColors } from "../utils/theme";
import type { GateApp } from "../utils/types";

const gateLink = (app: GateApp) => `stopscroll://gate?app=${app}`;

function appColor(app: GateApp, colors: ThemeColors, isDark: boolean): string {
  if (app === "reels") return colors.indigo;
  if (app === "shorts") return colors.danger;
  return isDark ? "#3A3A3C" : "#1C1C1E";
}

export function GateSetupScreen({ navigation }: RootStackScreenProps<"GateSetup">) {
  const { colors, isDark } = useThemeColors();
  const app = useApp();
  const enabledApps = app.settings.gateApps;

  const toggle = (id: GateApp, on: boolean) => {
    haptics.selection();
    const next = GATE_APPS.map((item) => item.id).filter((item) =>
      item === id ? on : enabledApps.includes(item),
    );
    app.updateSettings({ gateApps: next });
  };

  return (
    <Screen>
      <BackButton label="Настройки" />
      <AppText variant="title" accessibilityRole="header" className="px-1">
        Пауза перед лентой
      </AppText>
      <AppText tone="muted" className="px-1 pb-1">
        Когда вы открываете TikTok, Instagram или YouTube, StopScroll сначала показывает паузу:
        таймер, дыхание и ваш счёт. Открыть приложение можно — но только когда пауза закончится.
      </AppText>

      <Button
        label="Посмотреть, как выглядит пауза"
        icon="eye-outline"
        variant="secondary"
        onPress={() =>
          navigation.navigate("Gate", { app: enabledApps[0] ?? "tiktok", preview: true })
        }
      />

      <ListGroup
        header="Приложения"
        footer={`После «Всё равно открыть» приложение ${GATE_ALLOW_MINUTES} минут открывается без паузы.`}
      >
        {GATE_APPS.map((item) => (
          <ListRow
            key={item.id}
            icon={item.icon}
            iconColor={appColor(item.id, colors, isDark)}
            title={item.appName}
            subtitle={
              item.id === "tiktok" ? "Лента TikTok" : item.id === "reels" ? "Reels" : "Shorts"
            }
            right={
              <Switch
                value={enabledApps.includes(item.id)}
                onValueChange={(on) => toggle(item.id, on)}
                trackColor={{ true: colors.successBright, false: colors.ringTrack }}
                accessibilityLabel={`Пауза перед ${item.appName}`}
              />
            }
          />
        ))}
      </ListGroup>

      <Card>
        <Stepper
          label="Длительность паузы"
          hint="Столько длится таймер, прежде чем можно открыть приложение"
          value={app.settings.gateSeconds}
          min={GATE_SECONDS_RANGE.min}
          max={GATE_SECONDS_RANGE.max}
          step={GATE_SECONDS_RANGE.step}
          format={(value) => `${value} с`}
          onChange={(value) => app.updateSettings({ gateSeconds: value })}
        />
      </Card>

      {GATE_MODE === "shortcuts" ? (
        <ShortcutsGuide apps={GATE_APPS.filter((item) => enabledApps.includes(item.id))} />
      ) : GATE_MODE === "service" ? (
        <ServiceGuide />
      ) : (
        <Card className="gap-2">
          <AppText variant="heading">Только в приложении</AppText>
          <AppText variant="caption" tone="muted">
            Браузер не видит другие приложения, поэтому здесь пауза доступна только как
            предпросмотр. На iPhone она подключается через «Команды», на Android — через специальные
            возможности.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

/** iOS: a personal automation in Shortcuts opens the pause; one per app. */
function ShortcutsGuide({ apps }: { apps: readonly GateAppInfo[] }) {
  const steps = [
    "Откройте «Команды» → вкладка «Автоматизация» → «+».",
    "Выберите «Приложение» → «Выбрать», отметьте приложение. Оставьте «Открыто» и включите «Выполнять сразу».",
    "«Новая пустая автоматизация» → «Добавить действие» → StopScroll → «Нужна пауза перед лентой?». Выберите в нём то же приложение.",
    "Добавьте действие «Если»: условие — результат прошлого шага, значение — «Истина».",
    "Внутрь «Если» добавьте «Открыть URL» со ссылкой для этого приложения (ниже).",
  ];
  return (
    <>
      <ListGroup
        header="Как включить на iPhone"
        footer="iOS не позволяет приложениям следить за запуском других приложений. Поэтому пауза подключается через автоматизацию «Команд» — один раз для каждого приложения. Шаг «Нужна пауза?» не даёт паузе повториться, когда вы уже решили открыть ленту."
      >
        {steps.map((text, index) => (
          <View key={text} className="flex-row gap-3 px-4 py-3">
            <View className="h-[26px] w-[26px] items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900">
              <AppText variant="label" tone="primary" className="text-[14px]">
                {index + 1}
              </AppText>
            </View>
            <AppText variant="caption" className="flex-1 text-[15px] leading-[21px]">
              {text}
            </AppText>
          </View>
        ))}
      </ListGroup>

      {apps.length > 0 ? (
        <ListGroup
          header="Ссылки для шага 5"
          footer="Нажмите и удерживайте ссылку, чтобы скопировать."
        >
          {apps.map((item) => (
            <View key={item.id} className="gap-0.5 px-4 py-3">
              <AppText variant="label">{item.appName}</AppText>
              <AppText variant="caption" tone="primary" selectable>
                {gateLink(item.id)}
              </AppText>
            </View>
          ))}
        </ListGroup>
      ) : null}

      <Button label="Открыть «Команды»" icon="open-outline" onPress={openGateSystemSetup} />
    </>
  );
}

/** Android: an accessibility service watches which app comes to the screen. */
function ServiceGuide() {
  const { colors } = useThemeColors();
  const [enabled, setEnabled] = useState(isGateServiceEnabled);

  // The user flips the switch in system settings; re-check when they come back.
  const refresh = useCallback(() => setEnabled(isGateServiceEnabled()), []);
  useFocusEffect(refresh);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return (
    <>
      <ListGroup header="Служба паузы">
        <ListRow
          icon={enabled ? "checkmark-circle" : "alert-circle"}
          iconColor={enabled ? colors.successBright : colors.warning}
          title={enabled ? "Включена" : "Выключена"}
          subtitle={
            enabled
              ? "Пауза появится, когда вы откроете выбранные приложения."
              : "Без неё StopScroll не узнает, что вы открыли ленту."
          }
        />
      </ListGroup>
      <Card className="gap-2">
        <AppText variant="heading">Что видит служба</AppText>
        <AppText variant="caption" tone="muted">
          Только название приложения, которое появилось на экране, — чтобы показать паузу перед
          TikTok, Instagram и YouTube. Содержимое экранов она не читает, ничего не записывает и
          никуда не отправляет. Выключить её можно в любой момент там же, в настройках.
        </AppText>
      </Card>
      <Button
        label={enabled ? "Открыть специальные возможности" : "Включить в настройках"}
        icon="settings-outline"
        variant={enabled ? "secondary" : "primary"}
        onPress={openGateSystemSetup}
      />
      {!enabled ? (
        <AppText variant="caption" tone="subtle" className="px-1 text-center text-[13px]">
          Специальные возможности → Установленные приложения → «StopScroll — пауза перед лентой».
        </AppText>
      ) : null}
    </>
  );
}
