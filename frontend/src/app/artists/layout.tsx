import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists — The Story of Painters, Poets & Authors",
  description:
    "Explore the story of art and literature through biographies of the world's greatest painters, poets, and authors — Leonardo da Vinci, Van Gogh, Monet, Rumi, Hafez, Tolstoy, Hemingway, Borges and more. A curated journey across centuries and cultures.",
  keywords: [
    "story of art",
    "story of artists",
    "history of art",
    "art biographies",
    "famous painters",
    "famous authors",
    "famous poets",
    "writers biographies",
    "painters biographies",
    "art history timeline",
    "literature timeline",
    "Leonardo da Vinci",
    "Van Gogh",
    "Monet",
    "Rumi",
    "Hafez",
    "Tolstoy",
    "Dastan",
  ],
  alternates: { canonical: "/artists" },
  openGraph: {
    type: "website",
    url: "https://www.mydastan.com/artists",
    title: "Artists — The Story of Painters, Poets & Authors | Dastan",
    description:
      "Biographies, works, and stories of painters, poets, and authors across centuries — a curated journey through the history of art and literature.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Artists — A Story of Art and Literature",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Artists — The Story of Painters, Poets & Authors | Dastan",
    description:
      "Biographies of the world's greatest painters, poets, and authors — a curated journey across centuries.",
    images: ["/og-image.png"],
  },
};

export default function ArtistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
