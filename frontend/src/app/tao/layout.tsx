import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tao Te Ching — Twelve Passages from the Book of the Way",
  description:
    "Twelve selected chapters from Lao Tzu's Tao Te Ching, each paired with the original Chinese, an original essay, and a pull quote. A quiet reading room inside Dastan for the small book of the Way.",
  keywords: [
    "Tao Te Ching",
    "Lao Tzu",
    "Daodejing",
    "Taoism",
    "Chinese classics",
    "Book of the Way",
    "Dastan",
  ],
  alternates: { canonical: "/tao" },
  openGraph: {
    type: "article",
    url: "https://www.mydastan.com/tao",
    title: "Tao Te Ching — Twelve Passages | Dastan",
    description:
      "Twelve chapters of the Tao Te Ching, with original Chinese text and essays written in the Dastan voice.",
  },
};

export default function TaoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
