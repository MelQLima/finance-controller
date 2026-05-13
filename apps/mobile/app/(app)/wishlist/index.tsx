import { useCallback } from "react";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { formatCurrency } from "@finance-controller/shared";
import { AppScreen } from "@/components/ui/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyPanel, Pill, SectionBar, StatTile } from "@/components/ui/fintech";
import { Subtitle } from "@/components/ui/typography";
import { getWishlistData } from "@/features/wishlist/wishlist-service";
import { colors } from "@/theme/colors";

function priorityLabel(p: string) {
  if (p === "high") return "Alta";
  if (p === "medium") return "Média";
  if (p === "low") return "Baixa";
  return p;
}

export default function WishlistIndexScreen() {
  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlistData,
  });

  useFocusEffect(
    useCallback(() => {
      query.refetch();
    }, [query]),
  );

  const items = query.data?.wishlist ?? [];
  const totalPlanned = items.reduce((sum, entry) => sum + entry.estimated_price, 0);
  const highPriority = items.filter((entry) => entry.priority === "high").length;

  return (
    <AppScreen
      eyebrow="Metas"
      title="Lista de desejos estruturada como painel de objetivos e orçamento pessoal."
      subtitle="Resumo no topo, prioridades visuais e cartões de meta mais próximos da referência."
    >
      <Card variant="accent">
        <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
          Resumo das metas
        </Text>
        <Text style={{ color: colors.primaryText, fontSize: 36, fontWeight: "800", letterSpacing: -1 }}>
          {formatCurrency(totalPlanned)}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatTile label="Itens" value={String(items.length)} helper="Metas ativas" accent />
          <StatTile label="Alta prioridade" value={String(highPriority)} helper="Precisam de atenção" />
        </View>
        <Link
          href="/(app)/wishlist/new"
          style={{
            color: colors.primaryText,
            fontWeight: "800",
            textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.1)",
            paddingVertical: 16,
            borderRadius: 20,
          }}
        >
          + Novo item
        </Link>
      </Card>

      {query.isLoading ? <Subtitle>Carregando...</Subtitle> : null}
      {query.error ? <Subtitle>{query.error.message}</Subtitle> : null}

      <Card>
        <SectionBar
          title="Itens planejados"
          action={<Text style={{ color: colors.mutedText, fontSize: 12 }}>{items.length} ativos</Text>}
        />
        {!query.isLoading && !query.error && !items.length ? (
          <EmptyPanel title="Nenhum item na lista" subtitle="Registre compras desejadas e organize prioridades por valor e melhor momento." />
        ) : null}
        <View style={{ gap: 10 }}>
          {items.map((entry) => (
            <Link key={entry.id} href={`/(app)/wishlist/${entry.id}` as const} asChild>
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
                  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15, flex: 1 }}>{entry.title}</Text>
                  <Pill tone={entry.priority === "high" ? "danger" : entry.priority === "medium" ? "warning" : "success"}>
                    {priorityLabel(entry.priority)}
                  </Pill>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <Text style={{ color: colors.mutedText, fontSize: 12, flex: 1 }}>Preço: {formatCurrency(entry.estimated_price)}</Text>
                  <Text style={{ color: colors.mutedText, fontSize: 12, flex: 1, textAlign: "right" }}>
                    {entry.recommended_purchase_month ?? "Sem sugestão"}
                  </Text>
                </View>
                <Text style={{ color: colors.link, fontWeight: "700", fontSize: 13 }}>Abrir detalhes</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </Card>
    </AppScreen>
  );
}
