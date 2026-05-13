import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { formatCurrency } from "@finance-controller/shared";
import type { Statement } from "@finance-controller/shared";
import { findNodeHandle, Pressable, Text, View } from "react-native";
import type { ScrollView } from "react-native";
import { AppScreen } from "@/components/ui/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyPanel, Pill, SectionBar } from "@/components/ui/fintech";
import { Subtitle } from "@/components/ui/typography";
import { getCalendarItems } from "@/features/calendar/calendar-service";
import { colors } from "@/theme/colors";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const base = new Date(year, (monthIndex ?? 1) - 1 + offset, 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, (monthIndex ?? 1) - 1, 1));
}

function buildDays(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const totalDays = new Date(year, monthIndex ?? 1, 0).getDate();
  return Array.from({ length: totalDays }, (_, idx) => `${month}-${String(idx + 1).padStart(2, "0")}`);
}

function statusLabel(status: Statement["status"]) {
  if (status === "paid") return "Pago";
  if (status === "pending") return "Pendente";
  return "Agendado";
}

function scrollTodayRowIntoView(scrollRef: React.RefObject<ScrollView | null>, todayRef: React.RefObject<View | null>) {
  const scroll = scrollRef.current;
  const row = todayRef.current;
  if (!scroll || !row) return;
  const scrollNative = findNodeHandle(scroll);
  if (scrollNative == null) return;
  row.measureLayout(
    scrollNative,
    (_x, y) => {
      scroll.scrollTo({ y: Math.max(0, y - 72), animated: true });
    },
    () => {},
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const todayRef = useRef<View>(null);
  const [month, setMonth] = useState(getCurrentMonth);
  const query = useQuery({
    queryKey: ["calendar", month],
    queryFn: () => getCalendarItems(month),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Statement[]>();
    for (const item of query.data ?? []) {
      const rows = map.get(item.statement_date) ?? [];
      rows.push(item);
      map.set(item.statement_date, rows);
    }
    return map;
  }, [query.data]);

  const days = useMemo(() => buildDays(month), [month]);
  const today = new Date().toISOString().slice(0, 10);
  const highlightedDays = days.filter((day) => (grouped.get(day) ?? []).length).slice(0, 5);
  const todayInMonth = today.slice(0, 7) === month;

  const focusToday = useCallback(() => {
    if (!todayInMonth) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollTodayRowIntoView(scrollRef, todayRef));
    });
  }, [todayInMonth]);

  useFocusEffect(
    useCallback(() => {
      if (query.isLoading || query.isFetching) return;
      const id = setTimeout(focusToday, 160);
      return () => clearTimeout(id);
    }, [query.isLoading, query.isFetching, focusToday]),
  );

  useEffect(() => {
    if (query.isLoading || query.isFetching || !todayInMonth) return;
    const id = setTimeout(focusToday, 200);
    return () => clearTimeout(id);
  }, [query.isLoading, query.isFetching, todayInMonth, focusToday]);

  return (
    <AppScreen
      scrollViewRef={scrollRef}
      eyebrow="Calendário"
      title="Agenda mensal em uma estrutura mais próxima do calendário da referência."
      subtitle="Ao abrir a agenda, o dia de hoje entra em foco no mês atual. Toque em um dia para ver todas as transações, buscar, editar ou excluir."
    >
      <Card variant="accent">
        <SectionBar
          title={monthLabel(month)}
          action={
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, -1))}>
                <Text style={{ color: colors.primaryText, fontWeight: "800" }}>Anterior</Text>
              </Pressable>
              <Pressable onPress={() => setMonth((prev) => shiftMonth(prev, 1))}>
                <Text style={{ color: colors.primaryText, fontWeight: "800" }}>Próximo</Text>
              </Pressable>
            </View>
          }
        />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {highlightedDays.length ? highlightedDays.map((day) => <Pill key={day} active>{day.slice(8, 10)}</Pill>) : <Pill>Nenhum pico</Pill>}
        </View>
      </Card>

      {query.isLoading ? <Subtitle>Carregando mês...</Subtitle> : null}
      {query.error ? <Subtitle>{query.error.message}</Subtitle> : null}

      {!query.isLoading && !query.error ? (
        <Card>
          <SectionBar title="Dias" />
          {!days.length ? (
            <EmptyPanel title="Calendário vazio" subtitle="Nenhum dia foi encontrado para o mês selecionado." />
          ) : (
            <View
              onLayout={() => {
                if (todayInMonth) focusToday();
              }}
            >
              <View style={{ gap: 10 }}>
              {days.map((day) => {
                const items = grouped.get(day) ?? [];
                const isToday = day === today;

                return (
                  <Pressable
                    key={day}
                    ref={isToday ? todayRef : undefined}
                    accessibilityRole="button"
                    accessibilityLabel={`Transações do dia ${day.slice(8, 10)} de ${day.slice(5, 7)}`}
                    onPress={() => router.push({ pathname: "/(app)/calendar/day", params: { date: day } })}
                    style={({ pressed }) => ({
                      borderRadius: 20,
                      padding: 14,
                      backgroundColor: isToday ? "rgba(111, 84, 255, 0.18)" : "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: isToday ? colors.borderStrong : colors.border,
                      gap: 8,
                      opacity: pressed ? 0.88 : 1,
                    })}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>
                        {day.slice(8, 10)}/{day.slice(5, 7)}
                        {isToday ? (
                          <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}> · Hoje</Text>
                        ) : null}
                      </Text>
                      <Pill active={isToday}>{items.length} itens</Pill>
                    </View>
                    <Text style={{ color: colors.link, fontSize: 12, fontWeight: "700" }}>Toque para ver tudo, buscar e editar</Text>
                    {!items.length ? (
                      <Text style={{ color: colors.mutedText, fontSize: 13 }}>Nenhuma transação neste dia.</Text>
                    ) : (
                      items.slice(0, 2).map((item) => (
                        <View
                          key={item.id}
                          style={{
                            borderTopWidth: 1,
                            borderColor: colors.border,
                            paddingTop: 8,
                            gap: 3,
                          }}
                        >
                          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }}>{item.description}</Text>
                          <Text style={{ color: item.type === "income" ? colors.success : colors.danger, fontWeight: "800" }}>
                            {formatCurrency(item.amount)}
                          </Text>
                          <Text style={{ color: colors.mutedText, fontSize: 12 }}>{statusLabel(item.status)}</Text>
                        </View>
                      ))
                    )}
                    {items.length > 2 ? (
                      <Text style={{ color: colors.mutedText, fontSize: 12, fontWeight: "600" }}>+{items.length - 2} outras…</Text>
                    ) : null}
                  </Pressable>
                );
              })}
              </View>
            </View>
          )}
        </Card>
      ) : null}
    </AppScreen>
  );
}
