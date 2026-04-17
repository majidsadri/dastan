import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "In Search of Lost Time — Twelve Stations in the Long Book",
  description:
    "Twelve stations from Marcel Proust's In Search of Lost Time, each paired with a small French epigraph, an English translation, and an original essay. A quiet reading room inside Dastan for the longest, most patient book in European literature.",
  keywords: [
    "Marcel Proust",
    "In Search of Lost Time",
    "À la recherche du temps perdu",
    "Remembrance of Things Past",
    "Swann",
    "Albertine",
    "madeleine",
    "Dastan",
  ],
  alternates: { canonical: "/proust" },
  openGraph: {
    type: "article",
    url: "https://www.mydastan.com/proust",
    title: "In Search of Lost Time — Twelve Stations | Dastan",
    description:
      "Twelve stations from Proust's Recherche, with French epigraphs and essays in the Dastan voice.",
  },
};

export default function ProustLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
