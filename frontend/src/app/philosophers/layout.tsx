import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Philosophers — A Timeline of Ideas from Socrates to Arendt",
  description:
    "A philosophy timeline across 2,500 years — from Socrates, Plato, and Aristotle to Kant, Nietzsche, Sartre, and Hannah Arendt. Biographies, schools of thought, key ideas, and enduring quotes.",
  keywords: [
    "philosophy timeline",
    "history of philosophy",
    "philosophers biographies",
    "famous philosophers",
    "Western philosophy",
    "Socrates",
    "Plato",
    "Aristotle",
    "Kant",
    "Nietzsche",
    "Sartre",
    "Hannah Arendt",
    "existentialism",
    "stoicism",
    "philosophy for beginners",
    "schools of thought",
    "Dastan",
  ],
  alternates: { canonical: "/philosophers" },
  openGraph: {
    type: "website",
    url: "https://www.mydastan.com/philosophers",
    title: "Philosophers — A Timeline of Ideas | Dastan",
    description:
      "A philosophy timeline across 2,500 years — biographies, schools, and key ideas from Socrates to Arendt.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Philosophers — A Timeline of Ideas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Philosophers — A Timeline of Ideas | Dastan",
    description:
      "From Socrates to Arendt — biographies, schools, and key ideas across 2,500 years of philosophy.",
    images: ["/og-image.png"],
  },
};

export default function PhilosophersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
