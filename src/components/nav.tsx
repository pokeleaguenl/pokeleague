import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <Link href="/" className="text-lg font-bold">
        Poké<span className="text-yellow-400">League</span>
      </Link>
      <div className="flex gap-4 text-sm">
        <Link href="/decks" className="text-gray-400 hover:text-white">
          Decks
        </Link>
        <Link href="/dashboard" className="text-gray-400 hover:text-white">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
