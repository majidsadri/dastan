import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved — Your Favorite Art & Literature",
  description:
    "Your personal collection of saved paintings, novels, and poetry from Dastan. Bookmark the art and literature that moves you.",
  openGraph: {
    title: "Saved — Your Favorite Art & Literature | Dastan",
    description: "Your personal collection of bookmarked masterpieces and literary gems.",
  },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
