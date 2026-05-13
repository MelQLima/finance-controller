import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <QueryProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <Slot />
          </AuthProvider>
        </QueryProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
