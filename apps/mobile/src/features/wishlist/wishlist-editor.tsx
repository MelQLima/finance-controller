import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Edge } from "react-native-safe-area-context";
import { wishlistSchema, type ShoppingWishlistItem, type WishlistPriority, type WishlistSchema } from "@finance-controller/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { SelectSheet } from "@/components/ui/select-sheet";
import { Eyebrow, SectionTitle, Subtitle, Title } from "@/components/ui/typography";
import { useToast } from "@/providers/toast-provider";
import { formatCurrencyInputBR, maskDateInput, numberToCurrencyInputBR, parseCurrencyInputBR } from "@/utils/input-formatters";
import { deleteWishlistItem, getWishlistItemById, upsertWishlistItem } from "./wishlist-service";

const SCREEN_EDGES: readonly Edge[] = ["bottom", "left", "right"];

interface WishlistEditorProps {
  itemId?: string;
}

type WishlistField = keyof WishlistSchema;
type WishlistFieldErrors = Partial<Record<WishlistField, string>>;

export function WishlistEditor({ itemId }: WishlistEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = !!itemId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [item, setItem] = useState<ShoppingWishlistItem | null>(null);
  const [errors, setErrors] = useState<WishlistFieldErrors>({});

  const [title, setTitle] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [priority, setPriority] = useState<WishlistPriority>("medium");
  const [desiredDate, setDesiredDate] = useState("");
  const [notes, setNotes] = useState("");

  const clearFieldError = useCallback((field: WishlistField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: undefined };
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (itemId ? getWishlistItemById(itemId) : Promise.resolve(null))
      .then((existing) => {
        if (!mounted) return;
        setItem(existing);
        if (existing) {
          setTitle(existing.title ?? "");
          setEstimatedPrice(numberToCurrencyInputBR(existing.estimated_price));
          setPriority(existing.priority ?? "medium");
          setDesiredDate(existing.desired_date ?? "");
          setNotes(existing.notes ?? "");
        }
      })
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : "Falha ao carregar item", "error");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [itemId, showToast]);

  const priorityOptions = useMemo(
    () => [
      { label: "Baixa", value: "low" },
      { label: "Média", value: "medium" },
      { label: "Alta", value: "high" },
    ],
    [],
  );

  const saveMutation = useMutation({
    mutationFn: (payload: WishlistSchema) => upsertWishlistItem(payload, item?.id),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<{ wishlist: ShoppingWishlistItem[] }>(["wishlist"]);
      const optimistic: ShoppingWishlistItem = {
        id: item?.id ?? `temp-${Date.now()}`,
        user_id: "",
        title: payload.title,
        estimated_price: payload.estimated_price,
        priority: payload.priority,
        desired_date: payload.desired_date ?? null,
        recommended_purchase_month: null,
        notes: payload.notes ?? null,
        purchased_at: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<{ wishlist: ShoppingWishlistItem[] }>(["wishlist"], (current) => {
        const rows = current?.wishlist ?? [];
        const next = item?.id ? rows.map((row) => (row.id === item.id ? optimistic : row)) : [optimistic, ...rows];
        return { ...(current ?? { forecasts: [] }), wishlist: next };
      });
      return { previous };
    },
    onError: (err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(["wishlist"], context.previous);
      showToast(err instanceof Error ? err.message : "Falha ao salvar item", "error");
    },
    onSuccess: () => {
      showToast(isEdit ? "Item atualizado." : "Item criado.", "success");
      router.back();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWishlistItem,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData<{ wishlist: ShoppingWishlistItem[] }>(["wishlist"]);
      queryClient.setQueryData<{ wishlist: ShoppingWishlistItem[] }>(["wishlist"], (current) => ({
        ...(current ?? { forecasts: [] }),
        wishlist: (current?.wishlist ?? []).filter((entry) => entry.id !== id),
      }));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["wishlist"], context.previous);
      showToast(err instanceof Error ? err.message : "Falha ao remover item", "error");
    },
    onSuccess: () => {
      showToast("Item removido.", "success");
      router.back();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const submit = async () => {
    const parsed = wishlistSchema.safeParse({
      title,
      estimated_price: parseCurrencyInputBR(estimatedPrice),
      priority,
      desired_date: desiredDate || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      const nextErrors: WishlistFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !nextErrors[field as WishlistField]) {
          nextErrors[field as WishlistField] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    await saveMutation.mutateAsync(parsed.data).finally(() => setSaving(false));
  };

  const askDelete = () => {
    if (!item?.id) return;
    Alert.alert("Remover item", "Deseja remover este item da lista de desejos?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          await deleteMutation.mutateAsync(item.id).finally(() => setDeleting(false));
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
      <Eyebrow>{isEdit ? "Edição" : "Planejamento"}</Eyebrow>
      <Title>{isEdit ? "Editar meta" : "Novo item da lista"}</Title>
      <Subtitle>Organize compras futuras com prioridade, preço estimado e data desejada.</Subtitle>

      <Card>
        <SectionTitle>Item</SectionTitle>
        <Input
          label="Nome do item"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            clearFieldError("title");
          }}
          error={errors.title}
        />
        <Input
          label="Preço estimado"
          value={estimatedPrice}
          onChangeText={(value) => {
            setEstimatedPrice(formatCurrencyInputBR(value));
            clearFieldError("estimated_price");
          }}
          keyboardType="decimal-pad"
          error={errors.estimated_price}
        />
        <SelectSheet
          label="Prioridade"
          value={priority}
          options={priorityOptions}
          onSelect={(value) => {
            setPriority(value as WishlistPriority);
            clearFieldError("priority");
          }}
          error={errors.priority}
        />
      </Card>
      <Card variant="muted">
        <SectionTitle>Contexto</SectionTitle>
        <Input
          label="Data desejada (AAAA-MM-DD)"
          value={desiredDate}
          onChangeText={(value) => {
            setDesiredDate(maskDateInput(value));
            clearFieldError("desired_date");
          }}
          autoCapitalize="none"
          error={errors.desired_date}
        />
        <Input
          label="Observações"
          value={notes}
          onChangeText={(value) => {
            setNotes(value);
            clearFieldError("notes");
          }}
          error={errors.notes}
        />
      </Card>

      <Button onPress={submit} disabled={saving || deleting}>
        {saving ? "Salvando..." : "Salvar item"}
      </Button>

      {isEdit ? (
        <Button onPress={askDelete} variant="danger" disabled={saving || deleting}>
          {deleting ? "Removendo..." : "Remover item"}
        </Button>
      ) : null}
    </Screen>
  );
}
