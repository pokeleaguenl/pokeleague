import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          My <span className="text-yellow-400">Profile</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">{user.email}</p>
        {profile?.username && (
          <Link href={`/profile/${profile.username}`}
            className="mt-2 inline-flex items-center gap-1 text-xs text-yellow-400 hover:underline">
            View public profile →
          </Link>
        )}
      </div>
      <ProfileForm
        initialUsername={profile?.username ?? ""}
        initialDisplayName={profile?.display_name ?? ""}
        initialFirstName={profile?.first_name ?? ""}
        initialLastName={profile?.last_name ?? ""}
        initialDob={profile?.date_of_birth ?? ""}
        initialCountry={profile?.country_code ?? ""}
        totalPoints={profile?.total_points ?? 0}
      />
    </div>
  );
}
