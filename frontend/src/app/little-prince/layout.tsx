import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Le Petit Prince — An Illuminated Exhibit",
  description:
    "Thirteen scenes from Antoine de Saint-Exupéry's The Little Prince, with the author's own watercolor illustrations, original French quotes, and curated essays. A small museum room inside Dastan for one of the most translated books in the world.",
  keywords: [
    "Le Petit Prince",
    "The Little Prince",
    "Antoine de Saint-Exupéry",
    "Saint-Exupéry",
    "Little Prince illustrations",
    "Little Prince quotes",
    "Little Prince essay",
    "Petit Prince en français",
    "the fox the rose the prince",
    "what is essential is invisible to the eye",
    "children's literature",
    "French literature",
    "Dastan",
  ],
  alternates: { canonical: "/little-prince" },
  openGraph: {
    type: "article",
    url: "https://www.mydastan.com/little-prince",
    title: "Le Petit Prince — An Illuminated Exhibit | Dastan",
    description:
      "A curated walk through The Little Prince — thirteen scenes, original French quotes, Saint-Exupéry's own watercolors, and essays written in the Dastan voice.",
    images: [
      {
        url: "/little-prince/09-fox.png",
        width: 1200,
        height: 630,
        alt: "The Little Prince and the Fox — illustration by Antoine de Saint-Exupéry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Petit Prince — An Illuminated Exhibit | Dastan",
    description:
      "Thirteen scenes, original watercolors, and French quotes from The Little Prince — a small museum room inside Dastan.",
    images: ["/little-prince/09-fox.png"],
  },
};

export default function LittlePrinceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
