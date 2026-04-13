import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faal-e Hafez — Ask the Divan for an Answer",
  description:
    "A Persian tradition seven centuries old. Hold a question in your heart, draw a ghazal from the Divan of Hafez, and read its answer — bilingual Persian and English, with audio narration.",
  keywords: [
    "Faal", "Faal e Hafez", "Hafez", "Hafiz", "فال حافظ", "حافظ شیرازی",
    "Persian poetry", "ghazal", "divination", "Rubaiyat", "Shiraz",
    "Divan of Hafez", "Sufi poetry", "Farsi poetry", "bilingual poetry",
  ],
  openGraph: {
    title: "Faal-e Hafez — Ask the Divan | Dastan",
    description:
      "A seven-hundred-year-old Persian tradition. Hold your question, draw a ghazal, read the answer.",
  },
};

export default function FaalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
