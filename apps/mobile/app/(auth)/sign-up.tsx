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

export default function SignUpScreen() {
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
    const { error } = await supabase.auth.signUp(parsed.data);
    setSubmitting(false);
    if (error) {
      Alert.alert("Falha ao criar conta", error.message);
      return;
    }
    Alert.alert("Conta criada", "Confira seu e-mail para validar o cadastro.");
  };

  return (
    <Screen scroll>
      <View style={{ gap: 8 }}>
        <Eyebrow>Cadastro</Eyebrow>
        <Title>Crie sua conta em um fluxo com linguagem de app financeiro premium.</Title>
        <Subtitle>Cartão em destaque, métricas compactas e formulário alinhado ao painel principal.</Subtitle>
      </View>

      <Card variant="accent">
        <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
          Comece agora
        </Text>
        <Text style={{ color: colors.primaryText, fontSize: 28, fontWeight: "800", letterSpacing: -0.8 }}>
          Configure seu acesso
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pill active>Interface premium</Pill>
          <Pill>Finanças</Pill>
          <Pill>Seguro</Pill>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatTile label="Acesso" value="1 min" helper="Configuração rápida" accent />
          <StatTile label="Fluxos" value="3" helper="Transações, metas, recorrências" />
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
        {submitting ? "Salvando..." : "Criar conta"}
      </Button>
      <Link href="/(auth)/sign-in" style={{ color: colors.link, fontWeight: "800", textAlign: "center" }}>
        Já tenho conta
      </Link>
    </Screen>
  );
}
