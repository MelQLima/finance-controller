import { Suspense } from "react";
import { WishlistForm } from "@/components/forms/wishlist-form";
import { WishlistList } from "@/components/wishlist/wishlist-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormPanelSkeleton, ListSkeleton } from "@/components/ui/section-skeletons";
import { getWishlistData } from "@/services/wishlist";

export default function WishlistPage() {
  const wishlistPromise = getWishlistData();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="gap-2">
          <CardTitle>Future Purchase Planning</CardTitle>
          <p className="text-sm text-muted-foreground">Turn purchase intent into something measurable against your forecast.</p>
        </CardHeader>
        <CardContent>
          <WishlistForm />
        </CardContent>
      </Card>

      <Suspense fallback={<ListSkeleton total={4} />}>
        <WishlistListSection wishlistPromise={wishlistPromise} />
      </Suspense>
    </div>
  );
}

async function WishlistListSection({
  wishlistPromise,
}: {
  wishlistPromise: ReturnType<typeof getWishlistData>;
}) {
  const { wishlist } = await wishlistPromise;
  return <WishlistList items={wishlist} />;
}
