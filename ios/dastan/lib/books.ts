/**
 * Book catalog loaders — Little Prince + Siddhartha.
 *
 * The Next.js web app serves each catalog as a static JSON under
 * `/public/{book}/catalog.json`. The iOS app fetches the exact same
 * file so the content stays in one place: edit the JSON, deploy the
 * web, and the native reader picks up the new scenes on next launch.
 */

import Constants from "expo-constants";

const API_URL: string =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "https://www.mydastan.com";

export type LppScene = {
  id: string;
  number: number;
  title: string;
  chapter: string;
  image: string;
  english_quote: string;
  french_quote?: string;
  essay: string;
  pull_quote: string;
};

export type LppCatalog = {
  title: string;
  author: string;
  published: string;
  scenes: LppScene[];
};

export type SiddharthaScene = {
  id: string;
  number: number;
  title: string;
  chapter: string;
  motif: string;
  motif_caption: string;
  german_quote: string;
  english_quote: string;
  essay: string;
  pull_quote: string;
  editor_note?: string;
};

export type SiddharthaCatalog = {
  title: string;
  subtitle?: string;
  author: string;
  published: string;
  dedication?: string;
  introduction?: string;
  translator?: string;
  curator_note?: string;
  curator_signature?: string;
  scenes: SiddharthaScene[];
};

export type TaoScene = {
  id: string;
  number: number;
  title: string;
  chapter: string;
  theme: string;
  chinese_text: string;
  essay: string;
  pull_quote: string;
  editor_note?: string;
};

export type TaoCatalog = {
  title: string;
  author: string;
  published: string;
  translator?: string;
  curator_note?: string;
  curator_signature?: string;
  scenes: TaoScene[];
};

export type ProustScene = {
  id: string;
  number: number;
  title: string;
  chapter: string;
  motif: string;
  motif_caption: string;
  french_quote: string;
  english_quote: string;
  essay: string;
  pull_quote: string;
  editor_note?: string;
};

export type ProustCatalog = {
  title: string;
  subtitle?: string;
  author: string;
  published: string;
  translator?: string;
  curator_note?: string;
  curator_signature?: string;
  scenes: ProustScene[];
};

export async function fetchProustCatalog(): Promise<ProustCatalog> {
  const res = await fetch(`${API_URL}/proust/catalog.json`);
  if (!res.ok) throw new Error(`Proust catalog: ${res.status}`);
  return (await res.json()) as ProustCatalog;
}

export async function fetchTaoCatalog(): Promise<TaoCatalog> {
  const res = await fetch(`${API_URL}/tao/catalog.json`);
  if (!res.ok) throw new Error(`Tao Te Ching catalog: ${res.status}`);
  return (await res.json()) as TaoCatalog;
}

export async function fetchLppCatalog(): Promise<LppCatalog> {
  const res = await fetch(`${API_URL}/little-prince/catalog.json`);
  if (!res.ok) throw new Error(`Little Prince catalog: ${res.status}`);
  return (await res.json()) as LppCatalog;
}

export async function fetchSiddharthaCatalog(): Promise<SiddharthaCatalog> {
  const res = await fetch(`${API_URL}/siddhartha/catalog.json`);
  if (!res.ok) throw new Error(`Siddhartha catalog: ${res.status}`);
  return (await res.json()) as SiddharthaCatalog;
}

// Asset URL helper — the web stores scene illustrations as
// `/little-prince/01-boa-elephant.jpg` inside catalog.image; we
// just prefix with the origin when loading them in <Image>.
export function bookAssetUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${API_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

const ROMAN_NUMS = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
] as const;

export function roman(n: number): string {
  return ROMAN_NUMS[n] ?? String(n);
}
