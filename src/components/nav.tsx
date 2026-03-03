import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-800/50 px-4 py-3">
      <Link href="/dashboard" className="text-lg font-bold">
        Poké<span className="text-yellow-400">League</span>
      </Link>
      <div className="flex gap-4 text-sm">
        <Link href="/squad" className="text-gray-400 hover:text-white">Squad</Link>
        <Link href="/leaderboard" className="text-gray-400 hover:text-white">Board</Link>
        <Link href="/leagues" className="text-gray-400 hover:text-white">Leagues</Link>
        <Link href="/decks" className="text-gray-400 hover:text-white">Decks</Link>
        <Link href="/profile" className="text-gray-400 hover:text-white">Profile</Link>
      </div>
    </nav>
  );
}
