import { useCallback, useMemo } from "react";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Pressable, Text, View } from "react-native";
import { describeRecurringSchedulePt, inferScheduleFromRow, type RecurringItem } from "@finance-controller/shared";
import { AppScreen } from "@/components/ui/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyPanel, Pill, SectionBar, StatTile } from "@/components/ui/fintech";
import { Subtitle } from "@/components/ui/typography";
import { getRecurringItems } from "@/features/recurring/recurring-service";
import { colors } from "@/theme/colors";

export default function RecurringIndexScreen() {
  const query = useQuery<RecurringItem[], Error>({
    queryKey: ["recurring-items"],
    queryFn: getRecurringItems,
  });

  useFocusEffect(
    useCallback(() => {
      query.refetch();
    }, [query]),
  );

  const incomeCount = useMemo(() => (query.data ?? []).filter((item) => item.type === "income").length, [query.data]);
  const expenseCount = useMemo(() => (query.data ?? []).filter((item) => item.type === "expense").length, [query.data]);

  return (
    <AppScreen
      eyebrow="Recorrências"
      title="Fluxos fixos mensais organizados como agenda operacional mobile."
      subtitle="Receitas e despesas recorrentes em cards mais densos, próximos da referência."
    >
      <Card variant="accent">
        <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
          Fluxo fixo
        </Text>
        <Text style={{ color: colors.primaryText, fontSize: 36, fontWeight: "800", letterSpacing: -1 }}>{(query.data ?? []).length}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatTile label="Receitas" value={String(incomeCount)} helper="Itens de entrada" accent />
          <StatTile label="Despesas" value={String(expenseCount)} helper="Itens de saída" />
        </View>
        <Link
          href="/(app)/recurring/new"
          style={{
            color: colors.primaryText,
            fontWeight: "800",
            textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.1)",
            paddingVertical: 16,
            borderRadius: 20,
          }}
        >
          + Nova recorrência
        </Link>
      </Card>

      {query.isLoading ? <Subtitle>Carregando...</Subtitle> : null}
      {query.error ? <Subtitle>{query.error.message}</Subtitle> : null}

      <Card>
        <SectionBar title="Agenda fixa" />
        {!query.isLoading && !query.error && !(query.data ?? []).length ? (
          <EmptyPanel title="Nenhuma recorrência cadastrada" subtitle="Cadastre despesas e receitas fixas para estruturar as previsões." />
        ) : null}
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <Link href={`/(app)/recurring/${item.id}` as const} asChild>
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
                    <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15, flex: 1 }}>{item.description}</Text>
                    <Pill tone={item.type === "income" ? "success" : "warning"}>{item.type === "income" ? "Receita" : "Despesa"}</Pill>
                  </View>
                  <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                    {(() => {
                      const s = inferScheduleFromRow(item);
                      return describeRecurringSchedulePt(s.preset, {
                        dayOfMonth: s.dayOfMonth,
                        intervalMonths: s.intervalMonths,
                        dayOfWeek: s.dayOfWeek,
                      });
                    })()}
                  </Text>
                  <Text style={{ color: colors.link, fontWeight: "700", fontSize: 13 }}>Editar recorrência</Text>
              </Pressable>
            </Link>
          )}
        />
      </Card>
    </AppScreen>
  );
}
