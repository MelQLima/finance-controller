import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Subtitle } from "@/components/ui/typography";
import { RecurringEditor } from "@/features/recurring/recurring-editor";

export default function EditRecurringScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <Screen safeAreaEdges={["bottom", "left", "right"]}>
        <Subtitle>ID da recorrência inválido.</Subtitle>
      </Screen>
    );
  }

  return <RecurringEditor recurringId={id} />;
}
