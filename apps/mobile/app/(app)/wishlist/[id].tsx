import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Subtitle } from "@/components/ui/typography";
import { WishlistEditor } from "@/features/wishlist/wishlist-editor";

export default function EditWishlistItemScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <Screen safeAreaEdges={["bottom", "left", "right"]}>
        <Subtitle>ID do item inválido.</Subtitle>
      </Screen>
    );
  }

  return <WishlistEditor itemId={id} />;
}
