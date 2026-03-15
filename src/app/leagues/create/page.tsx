import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateLeagueForm from "./create-league-form";

export const dynamic = 'force-dynamic';

export default async function CreateLeaguePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create a League</h1>
        <p className="text-gray-400">
          Start your own league and invite friends to compete
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-8">
        <CreateLeagueForm />
      </div>

      <div className="mt-8 rounded-xl border border-blue-400/30 bg-blue-400/10 p-6">
        <h3 className="text-sm font-bold text-blue-400 mb-2">💡 How Leagues Work</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Create a private league with a unique 6-letter code</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Share the code with friends to invite them</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>League members compete across all tournaments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Track standings and see everyone's squads</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
