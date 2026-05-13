import { useCallback, useMemo, useState } from "react";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency, getStatementDate, type Statement } from "@finance-controller/shared";
import { Card } from "@/components/ui/card";
import { EmptyPanel, Pill } from "@/components/ui/fintech";
import { Input } from "@/components/ui/input";
import { Subtitle } from "@/components/ui/typography";
import { getCalendarItems } from "@/features/calendar/calendar-service";
import { deleteTransaction } from "@/features/transactions/transactions-service";
import { useToast } from "@/providers/toast-provider";
import { bottomScrollPaddingWithFloatingNav } from "@/theme/layout";
import { colors } from "@/theme/colors";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function statusLabel(status: Statement["status"]) {
  if (status === "paid") return "Pago";
  if (status === "pending") return "Pendente";
  return "Agendado";
}

function formatDayTitle(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, (m ?? 1) - 1, d ?? 1));
}

export default function CalendarDayScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = typeof params.date === "string" ? params.date.trim() : "";
  const month = date.length >= 7 ? date.slice(0, 7) : "";
  const valid = ISO_DAY.test(date);

  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["calendar", month],
    queryFn: () => getCalendarItems(month),
    enabled: valid && !!month,
  });

  useFocusEffect(
    useCallback(() => {
      if (valid && month) void query.refetch();
    }, [query, valid, month]),
  );

  const dayItems = useMemo(() => {
    if (!valid || !query.data) return [];
    return query.data.filter((row) => getStatementDate(row as unknown as Record<string, unknown>) === date);
  }, [query.data, date, valid]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dayItems;
    return dayItems.filter((row) => row.description.toLowerCase().includes(q));
  }, [dayItems, search]);

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      showToast("Transação removida.", "success");
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["forecast"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: unknown) => {
      showToast(err instanceof Error ? err.message : "Falha ao excluir", "error");
    },
  });

  const confirmDelete = (item: Statement) => {
    Alert.alert("Remover transação", `Remover "${item.description}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => deleteMutation.mutate(item.id),
      },
    ]);
  };

  if (!valid) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: insets.top + 12 }}>
        <Stack.Screen options={{ title: "Dia inválido", headerShown: true }} />
        <Subtitle>Data inválida. Volte ao calendário e escolha um dia.</Subtitle>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: formatDayTitle(date), headerShown: true, headerBackTitle: "Calendário" }} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: bottomScrollPaddingWithFloatingNav(insets.bottom),
          gap: 14,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <Text style={{ color: colors.mutedText, fontSize: 13, lineHeight: 20 }}>
              {dayItems.length} lançamento{dayItems.length === 1 ? "" : "s"} neste dia. Busque por descrição e toque em um item para editar.
            </Text>
            <Input
              label="Buscar por descrição"
              value={search}
              onChangeText={setSearch}
              placeholder="Ex.: mercado, aluguel…"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.isLoading ? <Subtitle>Carregando…</Subtitle> : null}
            {query.error ? <Text style={{ color: colors.danger, fontSize: 15 }}>{query.error.message}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          !query.isLoading && !query.error ? (
            <Card>
              {dayItems.length === 0 ? (
                <EmptyPanel title="Nada neste dia" subtitle="Não há transações com esta data de lançamento." />
              ) : (
                <EmptyPanel title="Nenhum resultado" subtitle="Nenhuma transação corresponde à busca." />
              )}
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
              <Link href={`/(app)/transactions/${item.id}` as const} asChild>
                <Pressable style={{ flex: 1, gap: 8, paddingVertical: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <Text style={{ flex: 1, color: colors.text, fontWeight: "800", fontSize: 16 }} numberOfLines={3}>
                      {item.description}
                    </Text>
                    <Pill tone={item.type === "income" ? "success" : "danger"}>{formatCurrency(item.amount)}</Pill>
                  </View>
                  <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                    {statusLabel(item.status)} • {item.statement_date}
                  </Text>
                  <Text style={{ color: colors.link, fontWeight: "700", fontSize: 13 }}>Editar</Text>
                </Pressable>
              </Link>
              <Pressable
                accessibilityLabel="Excluir transação"
                onPress={() => confirmDelete(item)}
                disabled={deleteMutation.isPending}
                style={{
                  justifyContent: "center",
                  paddingHorizontal: 6,
                  opacity: deleteMutation.isPending ? 0.5 : 1,
                }}
              >
                <MaterialCommunityIcons name="delete-outline" size={26} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
