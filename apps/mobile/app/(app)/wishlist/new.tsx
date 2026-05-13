import { BottomSheetFrame } from "@/components/ui/bottom-sheet-frame";
import { WishlistEditor } from "@/features/wishlist/wishlist-editor";
import { useRouter } from "expo-router";

export default function NewWishlistItemScreen() {
  const router = useRouter();

  return (
    <BottomSheetFrame onRequestClose={() => router.back()}>
      <WishlistEditor />
    </BottomSheetFrame>
  );
}
