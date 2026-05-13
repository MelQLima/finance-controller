import { useEffect } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    const code = typeof params.code === "string" ? params.code : "";
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).catch(() => undefined);
  }, [params.code]);

  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator />
      <Redirect href="/(app)/dashboard" />
    </SafeAreaView>
  );
}
