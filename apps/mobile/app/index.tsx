import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/colors";

export default function Index() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (session) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
