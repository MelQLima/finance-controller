import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
import { formatCurrency } from "@finance-controller/shared";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyPanel, ListRow, Pill, SectionBar, StatTile } from "@/components/ui/fintech";
import { AppScreen } from "@/components/ui/app-shell";
import { Subtitle } from "@/components/ui/typography";
import { getDashboardData } from "@/features/dashboard/dashboard-service";
import { colors } from "@/theme/colors";

export default function DashboardScreen() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
  });

  const data = query.data;
  const recent = data?.recentTransactions.slice(0, 4) ?? [];

  return (
    <AppScreen
      eyebrow="Painel"
      title="Seu dinheiro em uma interface com estrutura de banco digital."
      subtitle="Saldo total, ritmo do mês, atalhos rápidos e histórico recente organizados como um app financeiro nativo."
    >
      {query.isLoading ? <Subtitle>Carregando dados...</Subtitle> : null}
      {query.error ? <Subtitle>{query.error.message}</Subtitle> : null}

      {data ? (
        <Card variant="accent">
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
              Saldo total
            </Text>
            <Text style={{ color: colors.primaryText, fontSize: 40, fontWeight: "800", letterSpacing: -1.2 }}>
              {formatCurrency(data.currentBalance)}
            </Text>
            <Text style={{ color: "rgba(245, 247, 255, 0.74)", fontSize: 14, lineHeight: 21 }}>
              Leitura instantânea do caixa atual com foco em clareza visual e ação rápida.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pill active>Visão geral</Pill>
            <Pill>Cartões</Pill>
            <Pill>Gastos</Pill>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatTile label="Receitas" value={formatCurrency(data.income)} helper="Fluxo positivo" accent />
            <StatTile label="Despesas" value={formatCurrency(data.expense)} helper="Consumo atual" />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Link
              href="/(app)/transactions/new"
              style={{
                flex: 1,
                color: colors.primaryText,
                fontWeight: "800",
                textAlign: "center",
                backgroundColor: "rgba(255,255,255,0.1)",
                paddingVertical: 16,
                borderRadius: 20,
              }}
            >
              Nova transação
            </Link>
            <Link
              href="/(app)/wishlist/new"
              style={{
                flex: 1,
                color: colors.primaryText,
                fontWeight: "800",
                textAlign: "center",
                backgroundColor: "rgba(19, 21, 34, 0.48)",
                paddingVertical: 16,
                borderRadius: 20,
              }}
            >
              Nova meta
            </Link>
          </View>
        </Card>
      ) : null}

      {data ? (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatTile label="Carteira" value={formatCurrency(data.currentBalance)} helper="Saldo atual" />
          <StatTile label="Atividade" value={String(recent.length)} helper="Lançamentos recentes" accent />
        </View>
      ) : null}

      <Card variant="muted">
        <SectionBar
          title="Acesso rápido"
          action={
            <Link href="/(app)/settings" style={{ color: colors.link, fontWeight: "700" }}>
              Ajustes
            </Link>
          }
        />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Link href="/(app)/transactions" asChild>
              <Pressable
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 22,
                  padding: 16,
                  minHeight: 94,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>Transações</Text>
                <Text style={{ color: colors.mutedText }}>Fluxo mensal e edição.</Text>
              </Pressable>
            </Link>
          </View>
          <View style={{ flex: 1 }}>
            <Link href="/(app)/wishlist" asChild>
              <Pressable
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 22,
                  padding: 16,
                  minHeight: 94,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>Metas</Text>
                <Text style={{ color: colors.mutedText }}>Metas e planejamento.</Text>
              </Pressable>
            </Link>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Link href="/(app)/calendar" asChild>
              <Pressable
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 22,
                  padding: 16,
                  minHeight: 94,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>Calendário</Text>
                <Text style={{ color: colors.mutedText }}>Agenda financeira.</Text>
              </Pressable>
            </Link>
          </View>
          <View style={{ flex: 1 }}>
            <Link href="/(app)/forecast" asChild>
              <Pressable
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 22,
                  padding: 16,
                  minHeight: 94,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>Previsões</Text>
                <Text style={{ color: colors.mutedText }}>Projeções e tendências.</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </Card>

      <Card>
        <SectionBar
          title="Últimas transações"
          action={
            <Link href="/(app)/transactions" style={{ color: colors.link, fontWeight: "700" }}>
              Ver todas
            </Link>
          }
        />
        {recent.length ? recent.map((item) => <ListRow key={item.id} title={item.description} subtitle={item.statement_date} value={formatCurrency(item.amount)} tone={item.type === "income" ? "success" : "danger"} />) : <EmptyPanel title="Sem lançamentos recentes" subtitle="Assim que novas transações entrarem, elas aparecem aqui com leitura rápida." />}
      </Card>

      <Button onPress={() => supabase.auth.signOut()}>Sair</Button>
    </AppScreen>
  );
}
