import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        My <span className="text-yellow-400">Profile</span>
      </h1>
      <p className="mb-8 text-sm text-gray-400">Email: {user.email}</p>
      <ProfileForm
        initialUsername={profile?.username ?? ""}
        initialDisplayName={profile?.display_name ?? ""}
        totalPoints={profile?.total_points ?? 0}
      />
    </div>
  );
}
