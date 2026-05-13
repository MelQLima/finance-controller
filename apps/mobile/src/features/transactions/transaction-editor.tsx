import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text } from "react-native";
import { useRouter } from "expo-router";
import type { Edge } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  transactionSchema,
  type Account,
  type Category,
  type Statement,
  type StatementStatus,
  type StatementType,
  type TransactionSchema,
} from "@finance-controller/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuickCreateModal } from "@/components/ui/quick-create-modal";
import { SelectSheet } from "@/components/ui/select-sheet";
import { Screen } from "@/components/ui/screen";
import { Eyebrow, SectionTitle, Subtitle, Title } from "@/components/ui/typography";
import { useToast } from "@/providers/toast-provider";
import { colors } from "@/theme/colors";
import { formatCurrencyInputBR, maskDateInput, numberToCurrencyInputBR, parseCurrencyInputBR } from "@/utils/input-formatters";
import {
  createBasicCategories,
  createQuickAccount,
  createQuickCategory,
  deleteTransaction,
  getTransactionById,
  getTransactionReferences,
  upsertTransaction,
} from "./transactions-service";

/** Conteúdo sob header do Stack: topo já está na área segura. */
const SCREEN_EDGES: readonly Edge[] = ["bottom", "left", "right"];

interface TransactionEditorProps {
  transactionId?: string;
}

type TransactionField = keyof TransactionSchema;
type TransactionFieldErrors = Partial<Record<TransactionField, string>>;

export function TransactionEditor({ transactionId }: TransactionEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = !!transactionId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transaction, setTransaction] = useState<Statement | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<StatementType>("expense");
  const [status, setStatus] = useState<StatementStatus>("paid");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [installments, setInstallments] = useState("1");
  const [errors, setErrors] = useState<TransactionFieldErrors>({});
  const [newAccountName, setNewAccountName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [quickCreateTarget, setQuickCreateTarget] = useState<"account" | "category" | null>(null);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([getTransactionReferences(), transactionId ? getTransactionById(transactionId) : Promise.resolve(null)])
      .then(([references, existing]) => {
        if (!mounted) return;
        setAccounts(references.accounts);
        setCategories(references.categories);
        setTransaction(existing);

        if (existing) {
          setDescription(existing.description ?? "");
          setAmount(numberToCurrencyInputBR(existing.amount));
          setType(existing.type ?? "expense");
          setStatus(existing.status ?? "paid");
          setAccountId(existing.account_id ?? "");
          setCategoryId(existing.category_id ?? "");
          setStatementDate(existing.statement_date ?? new Date().toISOString().slice(0, 10));
          setDueDate(existing.due_date ?? existing.statement_date ?? new Date().toISOString().slice(0, 10));
          setInstallments(String(existing.installment_total ?? 1));
        }
      })
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : "Falha ao carregar dados da transação", "error");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showToast, transactionId]);

  const typeCategories = useMemo(() => categories.filter((item) => item.type === type), [categories, type]);
  const typeOptions = useMemo(
    () => [
      { label: "Despesa", value: "expense" },
      { label: "Receita", value: "income" },
    ],
    [],
  );
  const statusOptions = useMemo(
    () => [
      { label: "Pago", value: "paid" },
      { label: "Pendente", value: "pending" },
      { label: "Agendado", value: "scheduled" },
    ],
    [],
  );
  const accountOptions = useMemo(() => accounts.map((item) => ({ label: item.name, value: item.id })), [accounts]);
  const categoryOptions = useMemo(() => typeCategories.map((item) => ({ label: item.name, value: item.id })), [typeCategories]);

  const clearFieldError = useCallback((field: TransactionField) => {
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

  const saveMutation = useMutation({
    mutationFn: upsertTransaction,
    onMutate: async (payload: TransactionSchema) => {
      await queryClient.cancelQueries({ queryKey: ["transactions"] });
      const previous = queryClient.getQueryData<Statement[]>(["transactions"]);

      const optimisticId = payload.id ?? `temp-${Date.now()}`;
      const optimisticRow = {
        id: optimisticId,
        user_id: "",
        account_id: payload.account_id,
        category_id: payload.category_id,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        status: payload.status,
        statement_date: payload.statement_date,
        due_date: payload.due_date || null,
        installment_group_id: null,
        installment_number: null,
        installment_total: payload.installments,
        recurring_item_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies Statement;

      queryClient.setQueryData<Statement[]>(["transactions"], (rows = []) => {
        if (payload.id) {
          return rows.map((item) => (item.id === payload.id ? optimisticRow : item));
        }
        return [optimisticRow, ...rows];
      });

      return { previous };
    },
    onError: (err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["transactions"], context.previous);
      }
      showToast(err instanceof Error ? err.message : "Falha ao salvar transação", "error");
    },
    onSuccess: () => {
      showToast("Transação salva com sucesso.", "success");
      router.back();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["transactions"] });
      const previous = queryClient.getQueryData<Statement[]>(["transactions"]);
      queryClient.setQueryData<Statement[]>(["transactions"], (rows = []) => rows.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["transactions"], context.previous);
      showToast(err instanceof Error ? err.message : "Falha ao remover transação", "error");
    },
    onSuccess: () => {
      showToast("Transação removida.", "success");
      router.back();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
  });

  const submit = async () => {
    const parsed = transactionSchema.safeParse({
      id: transaction?.id,
      description,
      amount: parseCurrencyInputBR(amount),
      type,
      status,
      account_id: accountId,
      category_id: categoryId,
      statement_date: statementDate,
      due_date: dueDate,
      installments,
    });

    if (!parsed.success) {
      const nextErrors: TransactionFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !nextErrors[field as TransactionField]) {
          nextErrors[field as TransactionField] = issue.message;
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
    if (!transaction?.id) return;

    Alert.alert("Remover transação", "Deseja remover esta transação?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          await deleteMutation.mutateAsync(transaction.id).finally(() => setDeleting(false));
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
      <Eyebrow>{isEdit ? "Edição" : "Cadastro"}</Eyebrow>
      <Title>{isEdit ? "Editar transação" : "Nova transação"}</Title>
      <Subtitle>Preencha os dados do lançamento mantendo a lógica atual de conta, categoria, status e datas.</Subtitle>

      <Card>
        <SectionTitle>Dados principais</SectionTitle>
        <Input
          label="Descricao"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            clearFieldError("description");
          }}
          placeholder="Ex.: Mercado"
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
          placeholder="0.00"
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
        <SelectSheet
          label="Status"
          value={status}
          options={statusOptions}
          onSelect={(value) => {
            setStatus(value as StatementStatus);
            clearFieldError("status");
          }}
          error={errors.status}
        />
      </Card>

      <Card variant="muted">
        <SectionTitle>Datas e classificacao</SectionTitle>
        <Input
          label="Data de lançamento (AAAA-MM-DD)"
          value={statementDate}
          onChangeText={(value) => {
            setStatementDate(maskDateInput(value));
            clearFieldError("statement_date");
          }}
          autoCapitalize="none"
          error={errors.statement_date}
        />
        <Input
          label="Data de vencimento (AAAA-MM-DD)"
          value={dueDate}
          onChangeText={(value) => {
            setDueDate(maskDateInput(value));
            clearFieldError("due_date");
          }}
          autoCapitalize="none"
          error={errors.due_date}
        />

        {!isEdit ? (
          <Input
            label="Parcelas"
            value={installments}
            onChangeText={(value) => {
              setInstallments(value);
              clearFieldError("installments");
            }}
            keyboardType="number-pad"
            placeholder="1"
            error={errors.installments}
          />
        ) : null}

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
      </Card>

      {!accounts.length ? (
        <Card>
          <Text style={{ color: colors.mutedText }}>Você ainda não tem contas cadastradas no banco.</Text>
        </Card>
      ) : null}

      <Button onPress={submit} disabled={saving || deleting}>
        {saving ? "Salvando..." : "Salvar transação"}
      </Button>

      {isEdit && transaction?.id ? (
        <Button onPress={askDelete} variant="danger" disabled={saving || deleting}>
          {deleting ? "Removendo..." : "Remover transação"}
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
