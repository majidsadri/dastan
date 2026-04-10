import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Serif_4, Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import AuthLayout from "@/components/layout/AuthLayout";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  variable: "--font-farsi",
  subsets: ["arabic"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Dastan — Daily Art, Literature & Poetry | A Digital Museum",
    template: "%s | Dastan",
  },
  description:
    "Discover a new masterpiece painting, a page from a world novel, poetry from Hafez to Rumi, and a literature highlight — every single day. A calm digital museum for art lovers, book readers, and curious minds.",
  keywords: [
    "daily art", "art of the day", "painting of the day", "daily painting",
    "digital museum", "online art gallery", "art discovery",
    "world literature", "daily literature", "poetry of the day",
    "Hafez", "Rumi", "Persian poetry", "فال حافظ", "حافظ شیرازی",
    "classic novels", "book of the day", "novel pages",
    "art movements", "impressionism", "renaissance", "baroque", "cubism",
    "fine art", "masterpiece", "art history", "art education",
    "culture", "mindfulness", "daily inspiration", "creative writing",
    "haiku", "micro stories", "art and literature",
    "Dastan", "داستان",
  ],
  authors: [{ name: "Dastan" }],
  creator: "Dastan",
  publisher: "Dastan",
  metadataBase: new URL("https://www.mydastan.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.mydastan.com",
    siteName: "Dastan",
    title: "Dastan — Daily Art, Literature & Poetry",
    description:
      "Every day, a new painting, a page from a classic novel, a poem, and a moment of beauty. A calm digital museum for art and literature lovers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dastan — Every Day, a New Tale",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dastan — Daily Art, Literature & Poetry",
    description:
      "A new masterpiece painting, classic literature, and poetry — delivered every day. Your calm digital museum.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dastan",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/dastan_icon_1024x1024.png",
    apple: "/dastan_icon_1024x1024.png",
  },
  category: "art & culture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${sourceSerif.variable} ${inter.variable} ${notoNaskh.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Dastan",
              alternateName: "Dastan — Every Day, a New Tale",
              url: "https://www.mydastan.com",
              description:
                "A calm digital museum. Every day, discover a masterpiece painting, a page from a world novel, and a poetry highlight.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.mydastan.com/gallery?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Dastan",
              url: "https://www.mydastan.com",
              logo: "https://www.mydastan.com/dastan_icon_1024x1024.png",
              sameAs: [],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-parchment text-sepia">
        <AuthProvider>
          <AuthLayout>{children}</AuthLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
