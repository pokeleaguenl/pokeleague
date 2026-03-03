"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-8 rounded-lg border border-gray-700 px-6 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-white"
    >
      Log out
    </button>
  );
}
