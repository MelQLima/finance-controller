import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Edge } from "react-native-safe-area-context";
import {
  inferScheduleFromRow,
  recurringItemSchema,
  WEEKDAY_LABELS_PT,
  type RecurringItem,
  type RecurringItemSchema,
  type RecurringSchedulePreset,
  type StatementType,
} from "@finance-controller/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuickCreateModal } from "@/components/ui/quick-create-modal";
import { Screen } from "@/components/ui/screen";
import { SelectSheet } from "@/components/ui/select-sheet";
import { Eyebrow, SectionTitle, Subtitle, Title } from "@/components/ui/typography";
import { useToast } from "@/providers/toast-provider";
import { colors } from "@/theme/colors";
import { formatCurrencyInputBR, maskDateInput, numberToCurrencyInputBR, parseCurrencyInputBR } from "@/utils/input-formatters";
import {
  deleteRecurringItem,
  getRecurringItemById,
  getRecurringReferences,
  upsertRecurringItem,
} from "./recurring-service";
import { createBasicCategories, createQuickAccount, createQuickCategory } from "@/features/transactions/transactions-service";

const SCHEDULE_PRESET_OPTIONS: { label: string; value: RecurringSchedulePreset }[] = [
  { label: "Todo dia", value: "daily" },
  { label: "Toda semana (escolher o dia)", value: "weekly" },
  { label: "Todo mês (mesmo dia do mês)", value: "monthly" },
  { label: "A cada 3 meses (trimestral)", value: "quarterly" },
  { label: "Uma vez por ano", value: "yearly" },
  { label: "Personalizado (dia do mês + a cada N meses)", value: "custom" },
];

const WEEKDAY_OPTIONS = WEEKDAY_LABELS_PT.map((label, value) => ({ label, value: String(value) }));

interface RecurringEditorProps {
  recurringId?: string;
}

type RecurringField = keyof RecurringItemSchema;
type RecurringFieldErrors = Partial<Record<RecurringField, string>>;

const SCREEN_EDGES: readonly Edge[] = ["bottom", "left", "right"];

const fixedTemplates = [
  { value: "salary", label: "Salario fixo", description: "Salario", type: "income" as const, dayOfMonth: 5 },
  { value: "rent", label: "Aluguel", description: "Aluguel", type: "expense" as const, dayOfMonth: 10 },
  { value: "electricity", label: "Conta de energia", description: "Energia eletrica", type: "expense" as const, dayOfMonth: 15 },
  { value: "internet", label: "Internet", description: "Internet", type: "expense" as const, dayOfMonth: 12 },
  { value: "phone", label: "Telefone", description: "Telefone", type: "expense" as const, dayOfMonth: 20 },
];

export function RecurringEditor({ recurringId }: RecurringEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = !!recurringId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recurring, setRecurring] = useState<RecurringItem | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: StatementType }[]>([]);
  const [errors, setErrors] = useState<RecurringFieldErrors>({});

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<StatementType>("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 10));
  const [endsAt, setEndsAt] = useState("");
  const [templateValue, setTemplateValue] = useState("");
  const [schedulePreset, setSchedulePreset] = useState<RecurringSchedulePreset>("monthly");
  const [customIntervalMonths, setCustomIntervalMonths] = useState("3");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [newAccountName, setNewAccountName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [quickCreateTarget, setQuickCreateTarget] = useState<"account" | "category" | null>(null);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([getRecurringReferences(), recurringId ? getRecurringItemById(recurringId) : Promise.resolve(null)])
      .then(([refs, existing]) => {
        if (!mounted) return;
        setAccounts(refs.accounts);
        setCategories(refs.categories as { id: string; name: string; type: StatementType }[]);
        setRecurring(existing);

        if (existing) {
          setDescription(existing.description ?? "");
          setAmount(numberToCurrencyInputBR(existing.amount));
          setType(existing.type ?? "expense");
          setAccountId(existing.account_id ?? "");
          setCategoryId(existing.category_id ?? "");
          const inferred = inferScheduleFromRow(existing);
          setSchedulePreset(inferred.preset);
          setDayOfMonth(String(inferred.dayOfMonth));
          setCustomIntervalMonths(String(inferred.intervalMonths));
          setDayOfWeek(String(inferred.dayOfWeek));
          setStartsAt((existing.starts_at ?? existing.start_date ?? new Date().toISOString()).slice(0, 10));
          setEndsAt((existing.ends_at ?? existing.end_date ?? "").toString().slice(0, 10));
        }
      })
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : "Falha ao carregar recorrência", "error");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [recurringId, showToast]);

  const typeCategories = useMemo(() => categories.filter((item) => item.type === type), [categories, type]);
  const typeOptions = useMemo(
    () => [
      { label: "Despesa", value: "expense" },
      { label: "Receita", value: "income" },
    ],
    [],
  );
  const accountOptions = useMemo(() => accounts.map((item) => ({ label: item.name, value: item.id })), [accounts]);
  const categoryOptions = useMemo(() => typeCategories.map((item) => ({ label: item.name, value: item.id })), [typeCategories]);
  const templateOptions = useMemo(
    () => [{ label: "Selecionar modelo (opcional)", value: "" }, ...fixedTemplates.map((item) => ({ label: item.label, value: item.value }))],
    [],
  );
  const schedulePresetOptions = useMemo(
    () => SCHEDULE_PRESET_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
    [],
  );

  const clearFieldError = useCallback((field: RecurringField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: undefined };
    });
  }, []);

  useEffect(() => {
    if (categoryId && !typeCategories.some((item) => item.id === categoryId)) {
      setCategoryId("");
    }
    clearFieldError("category_id");
  }, [categoryId, clearFieldError, typeCategories]);

  const applyTemplate = (value: string) => {
    setTemplateValue(value);
    const template = fixedTemplates.find((item) => item.value === value);
    if (!template) return;
    setDescription(template.description);
    setType(template.type);
    setDayOfMonth(String(template.dayOfMonth));
    setSchedulePreset("monthly");
    clearFieldError("description");
    clearFieldError("type");
    clearFieldError("day_of_month");
    clearFieldError("schedule_preset");
  };

  const saveMutation = useMutation({
    mutationFn: (payload: RecurringItemSchema) => upsertRecurringItem(payload, recurring?.id),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-items"] });
      const previous = queryClient.getQueryData<RecurringItem[]>(["recurring-items"]);
      const optimisticId = recurring?.id ?? `temp-${Date.now()}`;
      const optimistic: RecurringItem = {
        id: optimisticId,
        user_id: "",
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        account_id: payload.account_id,
        category_id: payload.category_id,
        day_of_month: payload.day_of_month,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at ?? null,
        active: true,
        created_at: new Date().toISOString(),
        frequency: payload.schedule_preset,
        interval_months: payload.schedule_preset === "custom" ? (payload.interval_months ?? null) : null,
        day_of_week: payload.schedule_preset === "weekly" ? (payload.day_of_week ?? null) : null,
      };
      queryClient.setQueryData<RecurringItem[]>(["recurring-items"], (rows = []) => {
        if (recurring?.id) return rows.map((item) => (item.id === recurring.id ? optimistic : item));
        return [optimistic, ...rows];
      });
      return { previous };
    },
    onError: (err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(["recurring-items"], context.previous);
      showToast(err instanceof Error ? err.message : "Falha ao salvar recorrência", "error");
    },
    onSuccess: () => {
      showToast(isEdit ? "Recorrência atualizada." : "Recorrência criada.", "success");
      router.back();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-items"] });
      queryClient.invalidateQueries({ queryKey: ["forecast"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecurringItem,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["recurring-items"] });
      const previous = queryClient.getQueryData<RecurringItem[]>(["recurring-items"]);
      queryClient.setQueryData<RecurringItem[]>(["recurring-items"], (rows = []) => rows.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["recurring-items"], context.previous);
      showToast(err instanceof Error ? err.message : "Falha ao remover recorrência", "error");
    },
    onSuccess: () => {
      showToast("Recorrência removida.", "success");
      router.back();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-items"] });
      queryClient.invalidateQueries({ queryKey: ["forecast"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const submit = async () => {
    const parsed = recurringItemSchema.safeParse({
      description,
      amount: parseCurrencyInputBR(amount),
      type,
      account_id: accountId,
      category_id: categoryId,
      day_of_month: schedulePreset === "daily" || schedulePreset === "weekly" ? 1 : Number(dayOfMonth) || 1,
      schedule_preset: schedulePreset,
      interval_months:
        schedulePreset === "custom" ? Math.min(60, Math.max(1, Number(customIntervalMonths) || 1)) : undefined,
      day_of_week: schedulePreset === "weekly" ? Number(dayOfWeek) : undefined,
      starts_at: startsAt,
      ends_at: endsAt || undefined,
    });

    if (!parsed.success) {
      const nextErrors: RecurringFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !nextErrors[field as RecurringField]) {
          nextErrors[field as RecurringField] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    await saveMutation.mutateAsync(parsed.data).finally(() => setSaving(false));
  };

  const handleQuickCreate = async () => {
    if (!quickCreateTarget) return;
    setQuickCreateLoading(true);
    try {
      if (quickCreateTarget === "account") {
        const account = await createQuickAccount(newAccountName);
        setAccounts((prev) => [...prev, account].sort((a, b) => a.name.localeCompare(b.name)));
        setAccountId(account.id);
        setNewAccountName("");
        clearFieldError("account_id");
        showToast("Conta criada.", "success");
      } else {
        const category = await createQuickCategory(newCategoryName, type);
        setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
        setCategoryId(category.id);
        setNewCategoryName("");
        clearFieldError("category_id");
        showToast("Categoria criada.", "success");
      }
      setQuickCreateTarget(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Falha ao criar referência", "error");
    } finally {
      setQuickCreateLoading(false);
    }
  };

  const handleCreateBasicCategories = async () => {
    try {
      const created = await createBasicCategories(type);
      if (!created.length) {
        showToast("Categorias básicas já cadastradas.", "info");
        return;
      }
      setCategories((prev) => [...prev, ...created].sort((a, b) => a.name.localeCompare(b.name)));
      showToast(`${created.length} categorias adicionadas.`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Falha ao criar categorias básicas", "error");
    }
  };

  const askDelete = () => {
    if (!recurring?.id) return;
    Alert.alert("Remover recorrência", "Deseja remover esta recorrência?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          await deleteMutation.mutateAsync(recurring.id).finally(() => setDeleting(false));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen safeAreaEdges={SCREEN_EDGES} includeFloatingBottomInset>
        <Subtitle>Carregando...</Subtitle>
      </Screen>
    );
  }

  return (
    <Screen scroll safeAreaEdges={SCREEN_EDGES} includeFloatingBottomInset>
      <Eyebrow>{isEdit ? "Edição" : "Automação"}</Eyebrow>
      <Title>{isEdit ? "Editar recorrência" : "Nova recorrência"}</Title>
      <Subtitle>Defina valor, conta e um agendamento: presets (diário, semanal, mensal…) ou personalizado (ex.: dia 5 a cada 3 meses).</Subtitle>

      <Card>
        <SectionTitle>Estrutura</SectionTitle>
        <SelectSheet label="Modelo fixo" value={templateValue} options={templateOptions} onSelect={applyTemplate} />
        <Input
          label="Descrição"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            clearFieldError("description");
          }}
          error={errors.description}
        />
        <Input
          label="Valor"
          value={amount}
          onChangeText={(value) => {
            setAmount(formatCurrencyInputBR(value));
            clearFieldError("amount");
          }}
          keyboardType="decimal-pad"
          error={errors.amount}
        />
        <SelectSheet
          label="Tipo"
          value={type}
          options={typeOptions}
          onSelect={(value) => {
            setType(value as StatementType);
            clearFieldError("type");
          }}
          error={errors.type}
        />
      </Card>
      <Card variant="muted">
        <SectionTitle>Agendamento</SectionTitle>
        <SelectSheet
          label="Frequência"
          value={schedulePreset}
          options={schedulePresetOptions}
          onSelect={(value) => {
            setSchedulePreset(value as RecurringSchedulePreset);
            clearFieldError("schedule_preset");
            clearFieldError("interval_months");
            clearFieldError("day_of_week");
          }}
          error={errors.schedule_preset}
        />
        {schedulePreset === "weekly" ? (
          <SelectSheet
            label="Dia da semana"
            value={dayOfWeek}
            options={WEEKDAY_OPTIONS}
            onSelect={(value) => {
              setDayOfWeek(value);
              clearFieldError("day_of_week");
            }}
            error={errors.day_of_week}
          />
        ) : null}
        {schedulePreset !== "daily" && schedulePreset !== "weekly" ? (
          <Input
            label="Dia do mês (1–31)"
            value={dayOfMonth}
            onChangeText={(value) => {
              setDayOfMonth(value);
              clearFieldError("day_of_month");
            }}
            keyboardType="number-pad"
            error={errors.day_of_month}
          />
        ) : null}
        {schedulePreset === "custom" ? (
          <Input
            label="A cada quantos meses?"
            value={customIntervalMonths}
            onChangeText={(value) => {
              setCustomIntervalMonths(value.replace(/\D/g, ""));
              clearFieldError("interval_months");
            }}
            keyboardType="number-pad"
            placeholder="Ex.: 3"
            error={errors.interval_months}
          />
        ) : null}
      </Card>

      <Card variant="muted">
        <SectionTitle>Conta e classificação</SectionTitle>
        <SelectSheet
          label="Conta"
          value={accountId}
          options={accountOptions}
          placeholder={accounts.length ? "Selecionar conta" : "Nenhuma conta cadastrada"}
          onSelect={(value) => {
            setAccountId(value);
            clearFieldError("account_id");
          }}
          error={errors.account_id}
        />
        <Button onPress={() => setQuickCreateTarget("account")} variant="outline">
          + Criar conta rápida
        </Button>
        <SelectSheet
          label="Categoria"
          value={categoryId}
          options={categoryOptions}
          placeholder={typeCategories.length ? "Selecionar categoria" : "Sem categoria para o tipo"}
          onSelect={(value) => {
            setCategoryId(value);
            clearFieldError("category_id");
          }}
          error={errors.category_id}
        />
        <Button onPress={() => setQuickCreateTarget("category")} variant="outline">
          + Criar categoria rápida
        </Button>
        <Button onPress={handleCreateBasicCategories} variant="outline">
          Adicionar categorias básicas
        </Button>
        <Input
          label="Início (AAAA-MM-DD)"
          value={startsAt}
          onChangeText={(value) => {
            setStartsAt(maskDateInput(value));
            clearFieldError("starts_at");
          }}
          autoCapitalize="none"
          error={errors.starts_at}
        />
        <Input
          label="Fim (AAAA-MM-DD, opcional)"
          value={endsAt}
          onChangeText={(value) => {
            setEndsAt(maskDateInput(value));
            clearFieldError("ends_at");
          }}
          autoCapitalize="none"
          error={errors.ends_at}
        />
      </Card>

      {!accounts.length ? (
        <Card>
          <Text style={{ color: colors.mutedText }}>Você ainda não tem contas cadastradas.</Text>
        </Card>
      ) : null}

      <Button onPress={submit} disabled={saving || deleting}>
        {saving ? "Salvando..." : "Salvar recorrência"}
      </Button>

      {isEdit ? (
        <Button onPress={askDelete} variant="danger" disabled={saving || deleting}>
          {deleting ? "Removendo..." : "Remover recorrência"}
        </Button>
      ) : null}

      <QuickCreateModal
        open={quickCreateTarget === "account"}
        title="Nova conta"
        label="Nome da conta"
        value={newAccountName}
        onChange={setNewAccountName}
        onClose={() => setQuickCreateTarget(null)}
        onConfirm={handleQuickCreate}
        loading={quickCreateLoading}
      />
      <QuickCreateModal
        open={quickCreateTarget === "category"}
        title="Nova categoria"
        label="Nome da categoria"
        value={newCategoryName}
        onChange={setNewCategoryName}
        onClose={() => setQuickCreateTarget(null)}
        onConfirm={handleQuickCreate}
        loading={quickCreateLoading}
      />
    </Screen>
  );
}
