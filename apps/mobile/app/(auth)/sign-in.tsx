import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Link, Redirect } from "expo-router";
import { authSchema } from "@finance-controller/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill, StatTile } from "@/components/ui/fintech";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { Eyebrow, Subtitle, Title } from "@/components/ui/typography";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/colors";

export default function SignInScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const onSubmit = async () => {
    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) {
      Alert.alert("Validação", parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) Alert.alert("Falha ao entrar", error.message);
  };

  return (
    <Screen scroll>
      <View style={{ gap: 8 }}>
        <Eyebrow>Entrar</Eyebrow>
        <Title>Entre em uma tela com aparência mais próxima de banco digital.</Title>
        <Subtitle>Cartão em destaque, indicadores compactos e formulário denso para manter a identidade visual do app.</Subtitle>
      </View>

      <Card variant="accent">
        <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
          Bem-vindo de volta
        </Text>
        <Text style={{ color: colors.primaryText, fontSize: 28, fontWeight: "800", letterSpacing: -0.8 }}>
          Acesse seu painel
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pill active>Seguro</Pill>
          <Pill>Rápido</Pill>
          <Pill>Privado</Pill>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatTile label="Tema" value="Escuro" helper="Interface fintech" accent />
          <StatTile label="Modo" value="Mobile" helper="Pensado para toque" />
        </View>
      </Card>

      <Card>
        <Input
          label="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
        />
        <Input label="Senha" secureTextEntry placeholder="Senha" value={password} onChangeText={setPassword} />
      </Card>

      <Button onPress={onSubmit} disabled={submitting}>
        {submitting ? "Entrando..." : "Entrar"}
      </Button>
      <Link href="/(auth)/sign-up" style={{ color: colors.link, fontWeight: "800", textAlign: "center" }}>
        Criar conta
      </Link>
    </Screen>
  );
}
