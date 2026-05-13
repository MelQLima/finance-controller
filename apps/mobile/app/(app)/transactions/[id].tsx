import { useLocalSearchParams } from "expo-router";
import { Subtitle } from "@/components/ui/typography";
import { Screen } from "@/components/ui/screen";
import { TransactionEditor } from "@/features/transactions/transaction-editor";

export default function EditTransactionScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <Screen safeAreaEdges={["bottom", "left", "right"]}>
        <Subtitle>ID da transação inválido.</Subtitle>
      </Screen>
    );
  }

  return <TransactionEditor transactionId={id} />;
}
