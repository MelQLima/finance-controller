import { BottomSheetFrame } from "@/components/ui/bottom-sheet-frame";
import { TransactionEditor } from "@/features/transactions/transaction-editor";
import { useRouter } from "expo-router";

export default function NewTransactionScreen() {
  const router = useRouter();

  return (
    <BottomSheetFrame onRequestClose={() => router.back()}>
      <TransactionEditor />
    </BottomSheetFrame>
  );
}
