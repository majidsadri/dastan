import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive — Your Daily Art & Literature Journey",
  description:
    "Revisit every day's curated canvas — paintings, novel pages, poetry, and mood words from your personal art and literature journey on Dastan.",
  keywords: [
    "art archive", "daily art history", "literature archive",
    "painting history", "poetry collection", "reading journal",
    "art diary", "cultural journal", "daily inspiration archive",
  ],
  openGraph: {
    title: "Archive — Your Daily Art & Literature Journey | Dastan",
    description: "Look back at every day's painting, novel page, and poetry selection.",
  },
};

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
