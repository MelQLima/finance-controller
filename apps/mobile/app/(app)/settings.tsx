import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, Platform, Text } from "react-native";
import { AppScreen } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyPanel, Pill, SectionBar } from "@/components/ui/fintech";
import { notificationIngest } from "@/platform/notifications";
import { ALLOWED_FINANCE_NOTIFICATION_PACKAGES } from "@/platform/notifications/allowed-notification-packages";
import { setNotificationListenerUserPaused } from "@/platform/notifications/arm-finance-notification-listener";
import { colors } from "@/theme/colors";

type NotificationGateState =
  | { status: "idle" }
  | { status: "ready"; available: boolean; hasPermission: boolean };

export default function SettingsScreen() {
  const [notifGate, setNotifGate] = useState<NotificationGateState>({ status: "idle" });

  const refreshNotificationGate = useCallback(async () => {
    if (Platform.OS !== "android") {
      setNotifGate({ status: "ready", available: false, hasPermission: false });
      return;
    }
    try {
      const available = await notificationIngest.isAvailable();
      if (!available) {
        setNotifGate({ status: "ready", available: false, hasPermission: false });
        return;
      }
      const hasPermission = await notificationIngest.hasPermission();
      setNotifGate({ status: "ready", available: true, hasPermission });
    } catch {
      setNotifGate({ status: "ready", available: false, hasPermission: false });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshNotificationGate();
    }, [refreshNotificationGate]),
  );
  const checkModule = async () => {
    const available = await notificationIngest.isAvailable();
    Alert.alert("Módulo de notificações", available ? "Módulo nativo disponível." : "Módulo nativo ainda não implementado.");
  };

  const requestPermission = async () => {
    try {
      await notificationIngest.requestPermission();
      Alert.alert(
        "Acesso às notificações",
        "O Android não mostra um popup aqui: abrimos a lista de apps com permissão. Ative o Finance Controller e volte ao app.",
      );
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao abrir configuracoes.");
    }
  };

  const startListener = async () => {
    try {
      await setNotificationListenerUserPaused(false);
      await notificationIngest.setAllowedPackages([...ALLOWED_FINANCE_NOTIFICATION_PACKAGES]);
      await notificationIngest.startListener();
      await refreshNotificationGate();
      Alert.alert(
        "Escuta ativa",
        "Com permissão do Android, o app reativa a escuta ao voltar para o primeiro plano. Use Iniciar escuta após instalar ou se tiver parado manualmente.",
      );
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao iniciar a escuta.");
    }
  };

  const stopListener = async () => {
    try {
      await setNotificationListenerUserPaused(true);
      await notificationIngest.stopListener();
      await refreshNotificationGate();
      Alert.alert("Escuta pausada", "A leitura de notificações foi pausada.");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao parar a escuta.");
    }
  };

  return (
    <AppScreen
      eyebrow="Ajustes"
      title="Preferências, conta e integrações em um painel compacto."
      subtitle="Ações de notificação e status em blocos arredondados, coerentes com o restante do produto."
    >
      <Card variant="accent">
        <SectionBar title="Módulo de notificações" action={<Pill active>Android</Pill>} />
        <Text style={{ color: "rgba(245, 242, 255, 0.78)", fontSize: 14, lineHeight: 21 }}>
          No Android, o acesso às notificações não é um popup do app: o sistema abre uma tela onde você liga o Finance Controller manualmente.
        </Text>
      </Card>

      {notifGate.status === "ready" &&
      notifGate.available &&
      Platform.OS === "android" &&
      !notifGate.hasPermission ? (
        <Card>
          <SectionBar title="Acesso às notificações" />
          <Text style={{ color: colors.mutedText, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>
            Para o listener funcionar, ative o app na lista de &quot;Acesso às notificações&quot; do Android. Use o botão abaixo para abrir essa tela.
          </Text>
          <Button onPress={requestPermission}>Abrir configurações do Android</Button>
        </Card>
      ) : null}

      <Card>
        <SectionBar title="Ações" />
        <Text style={{ color: colors.mutedText, fontSize: 13, lineHeight: 20, marginBottom: 10 }}>
          Checklist: (1) acesso às notificações ligado no Android; (2) com permissão, o app reativa a escuta ao voltar ao app;
          (3) a lista inclui Nubank, Itaú/iti/cartões, PicPay, Inter e Google Wallet. Se Wallet e um banco notificarem o mesmo
          pagamento (mesmo valor e entrada/saída) em até 20 min, o segundo é ignorado. Classificação e valor vêm do texto. No
          Mac: adb logcat FCNotificationListener:D (no zsh, coloque o filtro *:S entre aspas) para ver o nativo. Lançamento na primeira conta se tipo e valor forem
          reconhecidos.
        </Text>
        <Button onPress={checkModule} variant="outline">
          Verificar módulo
        </Button>
        <Button onPress={requestPermission} variant="outline">
          Solicitar permissão
        </Button>
        <Button onPress={startListener} variant="outline">
          Iniciar escuta
        </Button>
        <Button onPress={stopListener} variant="outline">
          Parar escuta
        </Button>
      </Card>

      <Card variant="muted">
        <SectionBar title="Status" />
        {notifGate.status === "ready" && Platform.OS === "android" && notifGate.available && notifGate.hasPermission ? (
          <EmptyPanel title="Acesso concedido" subtitle="O Android já permite ler notificações para este app. Use Iniciar escuta quando quiser processar eventos." />
        ) : notifGate.status === "ready" && Platform.OS === "android" && notifGate.available && !notifGate.hasPermission ? (
          <EmptyPanel title="Acesso pendente" subtitle="Abra as configurações e ative o Finance Controller na lista de acesso às notificações." />
        ) : notifGate.status === "ready" && Platform.OS === "android" && !notifGate.available ? (
          <EmptyPanel
            title="Módulo nativo ausente"
            subtitle="Faça prebuild Android, copie os arquivos Kotlin e registre NotificationIngestPackage conforme apps/mobile/docs/notification-listener-setup.md."
          />
        ) : Platform.OS !== "android" ? (
          <EmptyPanel title="Somente Android" subtitle="O listener de notificações não se aplica no iOS." />
        ) : (
          <EmptyPanel title="Carregando" subtitle="Verificando módulo de notificações..." />
        )}
      </Card>
    </AppScreen>
  );
}
