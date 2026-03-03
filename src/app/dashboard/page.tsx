import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "./logout-button";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">
        Welcome to Poké<span className="text-yellow-400">League</span>
      </h1>
      <p className="mt-4 text-gray-400">
        Logged in as <span className="text-white">{user.email}</span>
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Dashboard coming soon. This is where you&apos;ll draft decks and track
        scores.
      </p>
      <LogoutButton />
    </div>
  );
}
