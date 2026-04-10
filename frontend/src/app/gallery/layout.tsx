import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Art Gallery — Explore Masterpiece Paintings",
  description:
    "Browse a curated collection of world masterpiece paintings — from Impressionism and Renaissance to Cubism and Symbolism. Filter by movement, explore artists like Monet, Vermeer, Klimt, and more.",
  keywords: [
    "art gallery", "painting collection", "masterpiece paintings",
    "Impressionism", "Renaissance", "Baroque", "Cubism", "Symbolism",
    "fine art", "art movements", "famous paintings", "classic art",
    "Monet", "Vermeer", "Klimt", "Cassatt", "David", "Renoir",
    "online art gallery", "art history", "painting exhibition",
  ],
  openGraph: {
    title: "Art Gallery — Explore Masterpiece Paintings | Dastan",
    description:
      "Browse masterpiece paintings from every movement and era. A curated digital gallery experience.",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
