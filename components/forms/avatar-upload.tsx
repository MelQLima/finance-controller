"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AvatarUpload({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    setLoading(true);
    const filePath = `${userId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
    toast.success("Avatar uploaded.");
  };

  return (
    <div className="space-y-3">
      <input type="file" accept="image/*" onChange={onChange} className="block w-full text-sm" />
      <Button variant="outline" disabled={loading}>
        {loading ? "Uploading..." : "Upload avatar to Supabase Storage"}
      </Button>
    </div>
  );
}
