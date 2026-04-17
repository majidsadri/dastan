import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Siddhartha — Twelve Stations on the Path to the River",
  description:
    "Twelve chapters from Hermann Hesse's Siddhartha, each with one German sentence, one zen motif, and one original essay. A quiet museum room inside Dastan for the small book that has taught so many readers how to listen.",
  keywords: [
    "Siddhartha",
    "Hermann Hesse",
    "Siddhartha essay",
    "Siddhartha quotes",
    "Siddhartha German",
    "Siddhartha chapters",
    "Buddhism literature",
    "zen literature",
    "Om",
    "the ferryman",
    "Vasudeva",
    "Dastan",
  ],
  alternates: { canonical: "/siddhartha" },
  openGraph: {
    type: "article",
    url: "https://www.mydastan.com/siddhartha",
    title: "Siddhartha — Twelve Stations | Dastan",
    description:
      "A contemplative walk through Siddhartha — twelve chapters, original German quotes, brushed zen motifs, and essays written in the Dastan voice.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Siddhartha — Twelve Stations | Dastan",
    description:
      "Twelve chapters of Siddhartha, with one German sentence, one ink motif, and one story for each.",
  },
};

export default function SiddharthaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
