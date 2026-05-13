import { Link } from "expo-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  buildForecastBucketDetail,
  buildForecastStackedCashflowSeries,
  formatCurrency,
  type ForecastChartGranularity,
  type ForecastStackedPoint,
} from "@finance-controller/shared";
import { AppScreen } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyPanel, ListRow, Pill, SectionBar, StatTile } from "@/components/ui/fintech";
import { Input } from "@/components/ui/input";
import { Subtitle } from "@/components/ui/typography";
import { getForecastData } from "@/features/forecast/forecast-service";
import { setInvestPercent } from "@/lib/invest-percent-setting";
import { useToast } from "@/providers/toast-provider";
import { colors } from "@/theme/colors";

const GRANULARITY_OPTIONS: { label: string; value: ForecastChartGranularity }[] = [
  { label: "Mensal", value: "monthly" },
  { label: "Trimestral", value: "quarterly" },
  { label: "Anual", value: "yearly" },
];

const STACK_BAR_HEIGHT = 132;
const BAR_GREEN = "rgba(105, 226, 161, 0.92)";
const BAR_RED = "rgba(255, 124, 146, 0.92)";
const BAR_EMPTY = "rgba(255,255,255,0.08)";

export default function ForecastScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [granularity, setGranularity] = useState<ForecastChartGranularity>("monthly");
  const [percentStr, setPercentStr] = useState("0");
  const [selectedBar, setSelectedBar] = useState<ForecastStackedPoint | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const query = useQuery({
    queryKey: ["forecast"],
    queryFn: () => getForecastData(),
  });

  useEffect(() => {
    if (query.data) setPercentStr(String(query.data.investPercent));
  }, [query.data]);

  const stackSeries = useMemo(() => {
    return buildForecastStackedCashflowSeries(query.data?.plan ?? [], granularity);
  }, [query.data?.plan, granularity]);

  const barSlotWidth = Math.max(96, Math.floor((windowWidth - 56) / 3));

  const bucketDetail = useMemo(() => {
    if (!selectedBar || !query.data?.plan?.length) return null;
    return buildForecastBucketDetail(query.data.plan, granularity, selectedBar.bucketKey, selectedBar.label);
  }, [selectedBar, query.data?.plan, granularity]);

  const currentYm = format(new Date(), "yyyy-MM");
  const curPlan = useMemo(() => {
    const plan = query.data?.plan ?? [];
    return plan.find((p) => p.month === currentYm) ?? plan[0];
  }, [query.data?.plan, currentYm]);

  const lastStack = stackSeries[stackSeries.length - 1];

  const granularityLabel = GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label ?? "";

  const applyPercent = async () => {
    const n = Math.min(100, Math.max(0, Number(percentStr.replace(",", ".")) || 0));
    try {
      await setInvestPercent(n);
      await queryClient.invalidateQueries({ queryKey: ["forecast"] });
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Percentual aplicado ao plano.", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Não foi possível guardar.", "error");
    }
  };

  return (
    <AppScreen
      eyebrow="Previsões"
      title="Planejamento de caixa"
      subtitle="Visão geral dos próximos períodos, depois o gráfico de saldo livre com entradas (verde) e saídas (vermelho). Investimento e detalhes ficam abaixo."
    >
      {query.isLoading ? <Subtitle>Carregando plano...</Subtitle> : null}
      {query.error ? <Subtitle>{query.error.message}</Subtitle> : null}

      <Card variant="accent">
        <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
          Visão geral
        </Text>
        <Text style={{ color: colors.primaryText, fontSize: 26, fontWeight: "800", letterSpacing: -0.8 }}>
          Saldo livre · {granularityLabel.toLowerCase()}
        </Text>
        <Text style={{ color: "rgba(245, 242, 255, 0.78)", fontSize: 15, lineHeight: 22, marginBottom: 8 }}>
          O gráfico junta recorrências e lançamentos do período. O valor em destaque é o saldo livre real (encadeado). Em cada barra, o verde (base) é proporcional às receitas e o vermelho (acima) às despesas do período.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", gap: 10 }}>
          {GRANULARITY_OPTIONS.map((opt) => (
            <Pill key={opt.value} active={granularity === opt.value} onPress={() => { setGranularity(opt.value); setSelectedBar(null); }}>
              {opt.label}
            </Pill>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatTile
            label="Saldo livre (último período)"
            value={lastStack ? formatCurrency(lastStack.free_balance) : "—"}
            helper={lastStack ? lastStack.label : "—"}
            accent
          />
        </View>
      </Card>

      <Card>
        <SectionBar title="Saldo livre por período" />
        {!stackSeries.length ? (
          <EmptyPanel title="Sem dados no horizonte" subtitle="Adicione contas, recorrências ou lançamentos agendados." />
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={{ color: colors.mutedText, fontSize: 12, lineHeight: 18 }}>
              Cerca de três barras por vez: deslize para outros períodos. Altura verde = receitas, vermelho = despesas (cada uma na proporção do total do período). Acima está o saldo livre no fim do período. Toque para o detalhe.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              nestedScrollEnabled
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 10,
                minHeight: STACK_BAR_HEIGHT + 52,
                paddingTop: 4,
                paddingBottom: 2,
              }}
            >
              {stackSeries.map((point, index) => {
                const absIn = Math.abs(point.inflow);
                const absOut = Math.abs(point.outflow);
                const totalMag = absIn + absOut;
                const innerBarH = STACK_BAR_HEIGHT - 4;
                const isLast = index === stackSeries.length - 1;
                const isSelected = selectedBar?.bucketKey === point.bucketKey;

                let greenH = 0;
                let redH = 0;
                if (totalMag > 0) {
                  greenH = Math.round(innerBarH * (absIn / totalMag));
                  redH = Math.round(innerBarH * (absOut / totalMag));
                  const drift = innerBarH - greenH - redH;
                  if (drift !== 0) {
                    if (absIn >= absOut) greenH += drift;
                    else redH += drift;
                  }
                }

                return (
                  <Pressable
                    key={point.bucketKey}
                    onPress={() => setSelectedBar(point)}
                    style={{ width: barSlotWidth, alignItems: "center", gap: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Detalhe ${point.label}`}
                  >
                    <Text
                      style={{
                        color: point.free_balance < 0 ? colors.danger : colors.text,
                        fontSize: 11,
                        fontWeight: "800",
                        textAlign: "center",
                        minHeight: 32,
                      }}
                      numberOfLines={2}
                    >
                      {formatCurrency(point.free_balance)}
                    </Text>
                    <View
                      style={{
                        width: "100%",
                        height: STACK_BAR_HEIGHT,
                        borderRadius: 14,
                        borderWidth: isLast || isSelected ? 2 : 0,
                        borderColor: isSelected ? colors.primary : isLast ? "rgba(111, 84, 255, 0.65)" : "transparent",
                        padding: 2,
                        overflow: "hidden",
                      }}
                    >
                      {totalMag <= 0 ? (
                        <View style={{ flex: 1, borderRadius: 12, backgroundColor: BAR_EMPTY }} />
                      ) : (
                        <View style={{ flex: 1, flexDirection: "column-reverse", borderRadius: 12, overflow: "hidden" }}>
                          {greenH > 0 ? (
                            <View style={{ height: greenH, width: "100%", backgroundColor: BAR_GREEN }} />
                          ) : null}
                          {redH > 0 ? <View style={{ height: redH, width: "100%", backgroundColor: BAR_RED }} /> : null}
                        </View>
                      )}
                    </View>
                    <Text style={{ color: colors.mutedText, fontSize: 10, fontWeight: "700", textAlign: "center" }} numberOfLines={2}>
                      {point.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: BAR_GREEN }} />
                <Text style={{ color: colors.mutedText, fontSize: 12 }}>Entradas (fixos, pendentes e pagos)</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: BAR_RED }} />
                <Text style={{ color: colors.mutedText, fontSize: 12 }}>Saídas (fixos, pendentes e pagos)</Text>
              </View>
            </View>
          </View>
        )}
      </Card>

      <Card variant="accent">
        <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" }}>
          Investimento (opcional)
        </Text>
        <Text style={{ color: "rgba(245, 242, 255, 0.78)", fontSize: 14, lineHeight: 21, marginBottom: 8 }}>
          Quando o saldo livre do mês for positivo, aplicamos este percentual sobre ele. Guardado neste aparelho.
        </Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Input
              label="% do saldo livre"
              value={percentStr}
              onChangeText={setPercentStr}
              keyboardType="decimal-pad"
              placeholder="0 a 100"
            />
          </View>
          <Button onPress={() => void applyPercent()} variant="outline">
            Aplicar
          </Button>
        </View>
      </Card>

      {curPlan ? (
        <Card>
          <SectionBar title={`Detalhe — ${curPlan.month}`} />
          <View style={{ gap: 10 }}>
            <ListRow title="Saldo na abertura" value={formatCurrency(curPlan.opening_balance)} />
            <ListRow title="Ganhos fixos (recorrências)" subtitle="Receitas programadas" value={formatCurrency(curPlan.fixed_income)} tone="success" />
            {curPlan.fixed_income_lines.length ? (
              <View style={{ gap: 6, paddingLeft: 4 }}>
                {curPlan.fixed_income_lines.map((line, i) => (
                  <View
                    key={`fi-${curPlan.month}-${i}-${line.description}`}
                    style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}
                  >
                    <Text style={{ color: colors.mutedText, fontSize: 13, flex: 1 }} numberOfLines={2}>
                      {line.description}
                    </Text>
                    <Text style={{ color: colors.success, fontSize: 13, fontWeight: "800" }}>{formatCurrency(line.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <ListRow title="Gastos fixos (recorrências)" subtitle="Despesas programadas" value={formatCurrency(curPlan.fixed_expense)} tone="danger" />
            {curPlan.fixed_expense_lines.length ? (
              <View style={{ gap: 6, paddingLeft: 4 }}>
                {curPlan.fixed_expense_lines.map((line, i) => (
                  <View
                    key={`fe-${curPlan.month}-${i}-${line.description}`}
                    style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}
                  >
                    <Text style={{ color: colors.mutedText, fontSize: 13, flex: 1 }} numberOfLines={2}>
                      {line.description}
                    </Text>
                    <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "800" }}>{formatCurrency(line.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <ListRow title="Parcelas no mês" subtitle="Pendentes ou agendadas" value={formatCurrency(curPlan.installments_expense)} tone="danger" />
            <ListRow
              title="Entradas pendentes ou agendadas"
              subtitle="Ainda não pagas"
              value={formatCurrency(curPlan.scheduled_statement_inflow)}
              tone="success"
            />
            <ListRow
              title="Saídas pendentes ou agendadas"
              subtitle="Inclui parcelas e avulsos ainda não pagos"
              value={formatCurrency(curPlan.scheduled_statement_outflow)}
              tone="danger"
            />
            <ListRow
              title="Entradas já pagas no mês"
              subtitle="Pela data do lançamento"
              value={formatCurrency(curPlan.paid_statement_inflow)}
              tone="success"
            />
            <ListRow
              title="Saídas já pagas no mês"
              subtitle="Espontâneas ou parcelas, pela data do lançamento"
              value={formatCurrency(curPlan.paid_statement_outflow)}
              tone="danger"
            />
            <ListRow title="Saldo livre" subtitle="Antes de investir" value={formatCurrency(curPlan.free_balance)} />
            {curPlan.free_balance > 0 ? (
              <ListRow
                title="Investimento sugerido"
                subtitle={`${curPlan.invest_percent}% do saldo livre`}
                value={formatCurrency(curPlan.invest_amount)}
              />
            ) : null}
            <ListRow title="Saldo após separar investimento" value={formatCurrency(curPlan.closing_after_invest)} />
          </View>
        </Card>
      ) : null}

      <Modal visible={!!selectedBar} transparent animationType="fade" onRequestClose={() => setSelectedBar(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setSelectedBar(null)} accessibilityLabel="Fechar detalhe" />
          <View style={[styles.modalSheet, { maxHeight: windowHeight * 0.82 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{selectedBar?.label}</Text>
                {bucketDetail?.months?.length ? (
                  <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                    {bucketDetail.months
                      .map((m) => format(parseISO(`${m}-01`), "MMMM yyyy", { locale: ptBR }))
                      .join(" · ")}
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={() => setSelectedBar(null)} hitSlop={12}>
                <Text style={{ color: colors.link, fontWeight: "700" }}>Fechar</Text>
              </Pressable>
            </View>
            {!bucketDetail ? (
              <Text style={{ color: colors.mutedText }}>Sem detalhe para este período.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator nestedScrollEnabled>
                <View style={{ gap: 10, paddingBottom: 8 }}>
                  <ListRow title="Saldo na abertura (primeiro mês)" value={formatCurrency(bucketDetail.opening_balance)} />
                  <ListRow
                    title="Ganhos fixos (soma no período)"
                    subtitle="Receitas programadas"
                    value={formatCurrency(bucketDetail.incomeLines.reduce((s, l) => s + l.amount, 0))}
                    tone="success"
                  />
                  {bucketDetail.incomeLines.length ? (
                    <View style={{ gap: 6, paddingLeft: 4 }}>
                      {bucketDetail.incomeLines.map((line, i) => (
                        <View
                          key={`modal-fi-${line.description}-${i}`}
                          style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}
                        >
                          <Text style={{ color: colors.mutedText, fontSize: 13, flex: 1 }} numberOfLines={2}>
                            {line.description}
                          </Text>
                          <Text style={{ color: colors.success, fontSize: 13, fontWeight: "800" }}>{formatCurrency(line.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <ListRow
                    title="Gastos fixos (soma no período)"
                    subtitle="Despesas programadas"
                    value={formatCurrency(bucketDetail.expenseLines.reduce((s, l) => s + l.amount, 0))}
                    tone="danger"
                  />
                  {bucketDetail.expenseLines.length ? (
                    <View style={{ gap: 6, paddingLeft: 4 }}>
                      {bucketDetail.expenseLines.map((line, i) => (
                        <View
                          key={`modal-fe-${line.description}-${i}`}
                          style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}
                        >
                          <Text style={{ color: colors.mutedText, fontSize: 13, flex: 1 }} numberOfLines={2}>
                            {line.description}
                          </Text>
                          <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "800" }}>{formatCurrency(line.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <ListRow title="Parcelas no período" subtitle="Pendentes ou agendadas" value={formatCurrency(bucketDetail.installments_expense)} tone="danger" />
                  <ListRow
                    title="Entradas pendentes ou agendadas"
                    subtitle="Ainda não pagas"
                    value={formatCurrency(bucketDetail.scheduled_inflow)}
                    tone="success"
                  />
                  <ListRow
                    title="Saídas pendentes ou agendadas"
                    subtitle="Inclui parcelas e avulsos ainda não pagos"
                    value={formatCurrency(bucketDetail.scheduled_outflow)}
                    tone="danger"
                  />
                  <ListRow
                    title="Entradas já pagas no período"
                    subtitle="Pela data do lançamento"
                    value={formatCurrency(bucketDetail.paid_inflow)}
                    tone="success"
                  />
                  <ListRow
                    title="Saídas já pagas no período"
                    subtitle="Espontâneas ou parcelas"
                    value={formatCurrency(bucketDetail.paid_outflow)}
                    tone="danger"
                  />
                  <ListRow title="Saldo livre (último mês do período)" subtitle="Antes de investir" value={formatCurrency(bucketDetail.free_balance_end)} />
                  <ListRow title="Investimento sugerido (último mês)" value={formatCurrency(bucketDetail.invest_amount_end)} />
                  <ListRow title="Saldo após separar investimento (último mês)" value={formatCurrency(bucketDetail.closing_after_invest_end)} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Card variant="muted">
        <SectionBar title="Recorrências" />
        <Link href="/(app)/recurring" asChild>
          <Pressable>
            <Text style={{ color: colors.link, fontWeight: "700" }}>Abrir recorrências</Text>
          </Pressable>
        </Link>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(8, 10, 20, 0.55)",
  },
  modalDismissArea: {
    flexGrow: 1,
    width: "100%",
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
});
