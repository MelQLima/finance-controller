import { Suspense } from "react";
import { LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AvatarUpload } from "@/components/forms/avatar-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelSkeleton } from "@/components/ui/section-skeletons";
import { getCurrentUser, getSupabaseForUser } from "@/services/session";
import type { Profile } from "@/types";

export default function SettingsPage() {
  const userPromise = getCurrentUser();
  const profilePromise = getProfile();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="gap-2">
          <CardTitle>Account Shortcuts</CardTitle>
          <p className="text-sm text-muted-foreground">Core actions and profile context without burying account controls in nested screens.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-[1.4rem] border border-border p-4 text-sm">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <p>Manage profile settings and session actions in this screen.</p>
          </div>
          <form action={logoutAction} className="sm:w-auto">
            <Button type="submit" variant="destructive" className="w-full sm:w-auto">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>

      <Suspense fallback={<PanelSkeleton lines={3} />}>
        <ProfileSection userPromise={userPromise} profilePromise={profilePromise} />
      </Suspense>

      <Suspense fallback={<PanelSkeleton lines={1} />}>
        <AvatarSection userPromise={userPromise} />
      </Suspense>
    </div>
  );
}

async function ProfileSection({
  userPromise,
  profilePromise,
}: {
  userPromise: ReturnType<typeof getCurrentUser>;
  profilePromise: ReturnType<typeof getProfile>;
}) {
  const [user, profile] = await Promise.all([userPromise, profilePromise]);

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Profile Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Current identity and currency preferences from your profile record.</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Email:</span> {user.email}
        </p>
        <p>
          <span className="text-muted-foreground">Name:</span> {profile?.full_name ?? "Not defined"}
        </p>
        <p>
          <span className="text-muted-foreground">Currency:</span> {profile?.currency ?? "USD"}
        </p>
      </CardContent>
    </Card>
  );
}

async function AvatarSection({
  userPromise,
}: {
  userPromise: ReturnType<typeof getCurrentUser>;
}) {
  const user = await userPromise;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Avatar (Supabase Storage)</CardTitle>
        <p className="text-sm text-muted-foreground">Upload and sync an avatar directly to your storage bucket.</p>
      </CardHeader>
      <CardContent>
        <AvatarUpload userId={user.id} />
      </CardContent>
    </Card>
  );
}

async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  const supabase = await getSupabaseForUser();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
}
