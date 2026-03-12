import type { Metadata } from "next";
import Nav from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokéLeague — Fantasy Pokémon TCG",
  description: "Draft your dream deck, compete with friends, and climb the leaderboard.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "PokéLeague — Fantasy Pokémon TCG",
    description: "Draft your dream deck, compete with friends, and climb the leaderboard.",
    siteName: "PokéLeague",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
