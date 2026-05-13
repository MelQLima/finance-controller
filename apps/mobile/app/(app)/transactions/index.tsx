import { useCallback, useMemo } from "react";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency, type Statement } from "@finance-controller/shared";
import { Card } from "@/components/ui/card";
import { AppScreen } from "@/components/ui/app-shell";
import { EmptyPanel, Pill, SectionBar, StatTile } from "@/components/ui/fintech";
import { getTransactions } from "@/features/transactions/transactions-service";
import { colors } from "@/theme/colors";

function statusLabel(status: string) {
  if (status === "paid") return "Pago";
  if (status === "pending") return "Pendente";
  if (status === "scheduled") return "Agendado";
  return status;
}

export default function TransactionsScreen() {
  const query = useQuery<Statement[], Error>({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(),
  });

  useFocusEffect(
    useCallback(() => {
      query.refetch();
    }, [query]),
  );

  const items = query.data ?? [];

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          if (item.type === "income") acc.income += item.amount;
          else acc.expense += item.amount;
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [items],
  );

  if (query.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (query.error) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.background }}>
        <Text style={{ textAlign: "center", color: colors.danger }}>{query.error.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <AppScreen
      eyebrow="Transações"
      title="Movimentações em uma estrutura mais próxima da tela de detalhes da referência."
      subtitle="Saldo em destaque, filtros compactos e lista de lançamentos com leitura rápida."
    >
      <Card variant="accent">
        <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
          Posição de caixa
        </Text>
        <Text style={{ color: colors.primaryText, fontSize: 38, fontWeight: "800", letterSpacing: -1.1 }}>
          {formatCurrency(totals.income - totals.expense)}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pill active>Todas</Pill>
          <Pill>Receitas</Pill>
          <Pill>Despesas</Pill>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatTile label="Entradas" value={formatCurrency(totals.income)} helper="Receitas do período" accent />
          <StatTile label="Saídas" value={formatCurrency(totals.expense)} helper="Gastos do período" />
        </View>
        <Link
          href="/(app)/transactions/new"
          style={{
            color: colors.primaryText,
            fontWeight: "800",
            textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.1)",
            paddingVertical: 16,
            borderRadius: 20,
          }}
        >
          + Nova transação
        </Link>
      </Card>

      <Card>
        <SectionBar
          title="Todas as movimentações"
          action={<Text style={{ color: colors.mutedText, fontSize: 12 }}>{items.length} itens</Text>}
        />
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10 }}
          ListEmptyComponent={<EmptyPanel title="Nenhuma transação encontrada" subtitle="Crie o primeiro lançamento para começar a consolidar o saldo." />}
          renderItem={({ item }) => (
            <Link href={`/(app)/transactions/${item.id}` as const} asChild>
              <Pressable
                style={{
                  borderRadius: 20,
                  padding: 14,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 8,
                }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>{item.description}</Text>
                    <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                      {item.statement_date} • {statusLabel(item.status)}
                    </Text>
                  </View>
                    <Pill tone={item.type === "income" ? "success" : "danger"}>{formatCurrency(item.amount)}</Pill>
                </View>
                <Text style={{ color: colors.link, fontWeight: "700", fontSize: 13 }}>Editar lançamento</Text>
              </Pressable>
            </Link>
          )}
        />
      </Card>
    </AppScreen>
  );
}
