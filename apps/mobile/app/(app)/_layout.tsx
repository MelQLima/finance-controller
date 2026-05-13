import { useQueryClient } from "@tanstack/react-query";
import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "@/components/ui/app-shell";
import { useFinancialNotificationListener } from "@/hooks/use-financial-notification-listener";
import { useStatementsRealtime } from "@/hooks/use-statements-realtime";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/colors";

export default function AppLayout() {
  const queryClient = useQueryClient();
  const { loading, session } = useAuth();
  useStatementsRealtime(session?.user.id);
  useFinancialNotificationListener({ queryClient });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          animation: "none",
          headerStyle: {
            backgroundColor: colors.backgroundStrong,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "800",
            color: colors.text,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerBackTitle: "Voltar",
        }}
      >
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="transactions/index" options={{ headerShown: false }} />
        <Stack.Screen name="wishlist/index" options={{ headerShown: false }} />
        <Stack.Screen name="forecast" options={{ headerShown: false }} />
        <Stack.Screen name="calendar" options={{ headerShown: false }} />
        <Stack.Screen name="calendar/day" options={{ headerShown: true, title: "Dia" }} />
        <Stack.Screen name="recurring/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="transactions/new"
          options={{
            title: "Nova transação",
            presentation: "transparentModal",
            animation: "none",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="transactions/[id]" options={{ title: "Editar transação" }} />
        <Stack.Screen
          name="wishlist/new"
          options={{
            title: "Nova meta",
            presentation: "transparentModal",
            animation: "none",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen name="wishlist/[id]" options={{ title: "Editar meta" }} />
        <Stack.Screen name="recurring/new" options={{ title: "Nova recorrência" }} />
        <Stack.Screen name="recurring/[id]" options={{ title: "Editar recorrência" }} />
      </Stack>
      <BottomNav />
    </View>
  );
}
