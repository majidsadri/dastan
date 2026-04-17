import Constants from "expo-constants";
import { supabase } from "./supabase";

/**
 * Base URL for the Dastan backend.
 *
 * Points at production by default. Override with `expo.extra.apiUrl`
 * in `app.json` to target a local backend during development:
 *
 *   "extra": { "apiUrl": "http://192.168.1.42:8000" }
 *
 * (localhost won't work from a real device on the same Wi-Fi — you
 * need your Mac's LAN IP.)
 */
const API_URL: string =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "https://www.mydastan.com";

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return {};
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── Types copied from frontend/src/lib/types.ts ──────────────────────
// (Intentionally kept minimal — only the fields the smoke-test screen needs.)

export type Painting = {
  id: number;
  title: string;
  artist: string;
  year: string;
  origin_country: string;
  movement: string;
  image_url: string;
  description?: string;
  artist_bio?: string;
  colors?: string[];
};

export type NovelPage = {
  novel_title: string;
  author: string;
  author_country?: string;
  page_number: number;
  total_pages: number;
  content: string;
};

export type Literature = {
  title: string;
  author: string;
  author_country?: string;
  genre: string;
  content: string;
  original_language?: string;
  original_text?: string | null;
};

export type TodayCanvas = {
  date: string;
  painting: Painting | null;
  novel_page: NovelPage | null;
  literature: Literature | null;
  mood_word: string | null;
  ai_prompt?: string;
};

export type DailyContent = {
  canvas: TodayCanvas;
};

export async function fetchTodayCanvas(): Promise<DailyContent> {
  return apiFetch<DailyContent>("/api/canvas/today");
}

// The web app uses this to re-roll a fresh random painting + novel
// page + verse without waiting for the next daily rotation. Hitting
// this ignores the "today" cache and gives the user a brand-new
// triptych — same shape as /api/canvas/today.
export async function fetchRefreshedCanvas(): Promise<DailyContent> {
  return apiFetch<DailyContent>("/api/canvas/refresh");
}

// ─── Gallery ──────────────────────────────────────────────────────────

export type GalleryItem = {
  title: string;
  artist: string;
  year: string;
  movement: string;
  category: string;
  origin_country: string;
  image_url: string; // relative, e.g. "/collection/impressionism/foo.jpg"
};

// The backend returns a fresh random sample on every request, which
// breaks the gallery → detail flow: the grid shows one random list,
// the detail screen refetches a *different* random list, and index 5
// no longer points at the painting the user tapped. We cache the
// first successful response in memory and serve it for the duration
// of the session. Callers that want a fresh sample can pass
// `force: true`.
let _galleryCache: GalleryItem[] | null = null;

export async function fetchGallery(
  count = 200,
  opts: { force?: boolean } = {}
): Promise<GalleryItem[]> {
  if (!opts.force && _galleryCache && _galleryCache.length >= count) {
    return _galleryCache.slice(0, count);
  }
  const items = await apiFetch<GalleryItem[]>(
    `/api/canvas/gallery?count=${count}`
  );
  _galleryCache = items;
  return items;
}

export function getCachedGallery(): GalleryItem[] | null {
  return _galleryCache;
}

/**
 * Fetch paintings by a specific artist (sorted chronologically).
 *
 * Strategy:
 *   1. Try the dedicated `/api/canvas/gallery/by-artist` endpoint.
 *      Fast and exact if the backend has it deployed.
 *   2. If that 404s (older prod), fall back to pulling the full
 *      gallery (count=2000 — larger than the ~1700-painting catalog
 *      so we get everything), filter client-side by case-insensitive
 *      name match, and sort by year.
 *
 * Either way, callers get a list of GalleryItem — no backend deploy
 * required for the page to work.
 */
export async function fetchPaintingsByArtist(
  name: string,
  limit = 18
): Promise<GalleryItem[]> {
  const needle = (name ?? "").trim().toLowerCase();
  if (!needle) return [];

  // --- 1. Try the dedicated endpoint first ---------------------------
  try {
    const q = encodeURIComponent(name);
    const viaEndpoint = await apiFetch<GalleryItem[]>(
      `/api/canvas/gallery/by-artist?name=${q}&limit=${limit}`
    );
    if (Array.isArray(viaEndpoint) && viaEndpoint.length > 0) {
      return viaEndpoint;
    }
  } catch {
    // 404 on older backends → fall through to client-side filter.
  }

  // --- 2. Client-side fallback: pull everything, filter locally -----
  // The full catalog is ~1700 paintings. Requesting count=2000 returns
  // all of them (the backend clamps to the catalog size). We cache the
  // result in `_byArtistCache` so repeated visits are instant.
  if (!_byArtistCache) {
    try {
      _byArtistCache = await apiFetch<GalleryItem[]>(
        `/api/canvas/gallery?count=2000`
      );
    } catch {
      return [];
    }
  }

  const matches = (_byArtistCache ?? []).filter(
    (p) => (p.artist ?? "").trim().toLowerCase() === needle
  );

  // Sort by year (leading 3-4 digit number); unknowns sink to the end.
  const yearOf = (y: string): number => {
    const m = /\d{3,4}/.exec(y ?? "");
    return m ? Number(m[0]) : 99999;
  };
  matches.sort((a, b) => yearOf(a.year) - yearOf(b.year));

  return matches.slice(0, limit);
}

// Session cache for the full-catalog pull used by the client-side
// filter fallback above. Separate from `_galleryCache` because that
// one holds the shuffled sample the main Gallery tab is showing and
// its order matters for tap-to-detail routing.
let _byArtistCache: GalleryItem[] | null = null;

/**
 * Turn a relative asset path (like `/collection/foo.jpg` or
 * `/philosophers/scenes/bar.png`) into the absolute URL served by the
 * backend. These files live in `frontend/public/` on the web, and
 * Next.js serves them from the root. The iOS app never bundles them
 * — it fetches from `API_URL` so launches stay under 20 MB.
 */
export function assetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── Artists ──────────────────────────────────────────────────────────

export type Artist = {
  id: string;
  name: string;
  type: string; // "painter" | "writer" | etc
  born: string;
  died: string;
  nationality: string;
  movement: string;
  key_works?: string[];
  article_title?: string;
  article?: string;
  pull_quote?: string;
  image?: string; // e.g. "/artists/claude-monet.jpg"
};

export type ArtistsCatalog = { artists: Artist[] };

export async function fetchArtists(): Promise<Artist[]> {
  // catalog.json is a static file served from the webapp root — not /api/
  const res = await fetch(`${API_URL}/artists/catalog.json`);
  if (!res.ok) throw new Error(`Artists catalog ${res.status}`);
  const data: ArtistsCatalog = await res.json();
  return data.artists.map((a) => {
    // Normalize long formal name to the common name used everywhere
    if (a.id === "hafez") {
      return { ...a, name: "Hafez" };
    }
    return a;
  });
}

// ─── User Profile ─────────────────────────────────────────────────────

export type UserProfile = {
  id: number;
  display_name: string;
  avatar: string | null;
  art_movements: string[];
  art_periods: string[];
  favorite_artists: string[];
  literary_genres: string[];
  favorite_authors: string[];
  preferred_languages: string[];
  themes: string[];
  regions: string[];
  created_at: string;
  updated_at: string;
};

export type UserProfileInput = Omit<
  UserProfile,
  "id" | "created_at" | "updated_at"
>;

/**
 * Read profile from Supabase user_metadata (same source as the web app).
 * Returns null if the user hasn't set up a profile yet.
 */
export async function fetchProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = user.user_metadata;
  if (!meta?.display_name) return null;
  return {
    id: 0,
    display_name: meta.display_name || "",
    avatar: meta.avatar || null,
    art_movements: meta.art_movements || [],
    art_periods: meta.art_periods || [],
    favorite_artists: meta.favorite_artists || [],
    literary_genres: meta.literary_genres || [],
    favorite_authors: meta.favorite_authors || [],
    preferred_languages: meta.preferred_languages || [],
    themes: meta.themes || [],
    regions: meta.regions || [],
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at,
  };
}

/**
 * Save profile to Supabase user_metadata + sync to backend for
 * curation. Mirrors the web app's saveProfileToSupabase flow.
 */
export async function saveProfile(
  data: UserProfileInput
): Promise<UserProfile> {
  const { data: result, error } = await supabase.auth.updateUser({
    data: {
      display_name: data.display_name,
      avatar: data.avatar,
      art_movements: data.art_movements,
      art_periods: data.art_periods,
      favorite_artists: data.favorite_artists,
      literary_genres: data.literary_genres,
      favorite_authors: data.favorite_authors,
      preferred_languages: data.preferred_languages,
      themes: data.themes,
      regions: data.regions,
    },
  });
  if (error) throw new Error(error.message);
  const meta = result.user.user_metadata;

  // Sync to backend for personalized curation
  syncProfileToBackend(data).catch(() => {});

  return {
    id: 0,
    display_name: meta.display_name || "",
    avatar: meta.avatar || null,
    art_movements: meta.art_movements || [],
    art_periods: meta.art_periods || [],
    favorite_artists: meta.favorite_artists || [],
    literary_genres: meta.literary_genres || [],
    favorite_authors: meta.favorite_authors || [],
    preferred_languages: meta.preferred_languages || [],
    themes: meta.themes || [],
    regions: meta.regions || [],
    created_at: result.user.created_at,
    updated_at: result.user.updated_at || result.user.created_at,
  };
}

async function syncProfileToBackend(data: UserProfileInput): Promise<void> {
  try {
    await apiFetch<unknown>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch {
    // PUT 404 → profile doesn't exist on backend yet, POST to create
    try {
      await apiFetch<unknown>("/api/profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {}
  }
}

/**
 * Quick check: does the current user have a profile set up?
 * Reads from Supabase user_metadata without a network call if
 * the session is already cached.
 */
export async function hasProfileSetup(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const meta = user.user_metadata;
  return !!(
    meta?.display_name &&
    meta?.art_movements?.length > 0
  );
}

// ─── Faal-e Hafez ─────────────────────────────────────────────────────

export type HafezPoem = {
  id: number;
  ghazal_number: number;
  title_en: string;
  title_fa: string;
  poet: string;
  poet_fa: string;
  era: string;
  origin: string;
  form: string;
  form_fa: string;
  farsi: { lines: string[]; couplets: string[][]; full_text: string };
  english: { lines: string[]; couplets: string[][]; full_text: string };
};

export type HafezCollection = {
  poems: HafezPoem[];
};

/**
 * The Divan of Hafez — cached in memory for the session. The file
 * is a static asset served from `/hafez/hafez-collection.json` on
 * the webapp, so we never need to deploy the backend to ship this.
 */
let _hafezCache: HafezPoem[] | null = null;

export async function fetchHafezPoems(): Promise<HafezPoem[]> {
  if (_hafezCache) return _hafezCache;
  const res = await fetch(`${API_URL}/hafez/hafez-collection.json`);
  if (!res.ok) throw new Error(`Hafez collection ${res.status}`);
  const data: HafezCollection = await res.json();
  _hafezCache = data.poems ?? [];
  return _hafezCache;
}

// ─── Text-to-Speech ──────────────────────────────────────────────────
//
// Two tiers:
// 1. Pre-generated: GET /api/tts/poem/{id}/{lang} serves high-quality
//    MP3s created offline with OpenAI tts-1-hd. Cached permanently on
//    device in the document directory so they survive app restarts.
// 2. Live fallback: POST /api/tts/speak generates on the fly via
//    Gemini/OpenAI for poems without pre-generated audio.

import { Directory, File, Paths } from "expo-file-system";

const _ttsAudioDir = new Directory(Paths.document, "faal-audio");

function _ensureAudioDir() {
  if (!_ttsAudioDir.exists) {
    _ttsAudioDir.create();
  }
}

export async function fetchPoemAudio(
  poemId: number,
  lang: "en" | "fa"
): Promise<string> {
  _ensureAudioDir();
  const filename = `${String(poemId).padStart(3, "0")}-${lang}.mp3`;
  const localFile = new File(_ttsAudioDir, filename);

  if (localFile.exists && localFile.size > 1000) {
    return localFile.uri;
  }

  const res = await fetch(`${API_URL}/api/tts/poem/${poemId}/${lang}`);
  if (!res.ok) {
    throw new Error(`poem-audio-${res.status}`);
  }

  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  localFile.create();
  localFile.write(bytes);
  return localFile.uri;
}

function _ttsCacheKey(text: string, voice: string, prompt: string): string {
  let h = 0;
  const raw = `${voice}|${prompt}|${text}`;
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) - h + raw.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export async function speakText(
  text: string,
  prompt: string = "Read this poem aloud slowly and beautifully, with feeling",
  voice: string = "Achernar"
): Promise<string> {
  _ensureAudioDir();
  const key = _ttsCacheKey(text, voice, prompt);
  const filename = `tts-${key}.mp3`;
  const localFile = new File(_ttsAudioDir, filename);

  if (localFile.exists && localFile.size > 1000) {
    return localFile.uri;
  }

  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/tts/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ text, voice, prompt }),
  });
  if (!res.ok) {
    throw new Error(`TTS error: ${res.status} ${res.statusText}`);
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const ext = ct.includes("mpeg") || ct.includes("mp3") ? "mp3" : "wav";

  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  const file = new File(_ttsAudioDir, `tts-${key}.${ext}`);
  file.create();
  file.write(bytes);
  return file.uri;
}

// ─── Philosophers ─────────────────────────────────────────────────────

export type Philosopher = {
  id: string;
  name: string;
  era: string;
  born: string;
  died: string;
  // Signed integer years (BCE negative, CE positive) — used by the
  // Schools-of-Thought stream graph to plot each thinker's lifespan
  // on a continuous 500 BCE → 2000 CE axis.
  born_year?: number;
  died_year?: number;
  nationality: string;
  school?: string;
  key_ideas?: string[];
  famous_quote?: string;
  fun_fact?: string;
  key_works?: string[];
  article_title?: string;
  article?: string;
  pull_quote?: string;
  image?: string;
};

export type PhilosopherEra = {
  id: string;
  name: string;
  period: string;
  color: string;
  description: string;
};

export type PhilosophersCatalog = {
  meta: {
    title: string;
    subtitle: string;
    description: string;
    eras: PhilosopherEra[];
  };
  philosophers: Philosopher[];
};

export async function fetchPhilosophers(): Promise<PhilosophersCatalog> {
  const res = await fetch(`${API_URL}/philosophers/catalog.json`);
  if (!res.ok) throw new Error(`Philosophers catalog ${res.status}`);
  return res.json();
}

// ─── Articles (Readings) ──────────────────────────────────────────────

export type Article = {
  id: string;
  title: string;
  subject: string;
  theme: string;
  era: string;
  visual_concept: string;
  article: string;
  pull_quote: string;
  ending_quote: string;
  ending_quote_attribution: string;
};

export type ArticlesData = {
  meta: { title: string; subtitle: string; description: string };
  articles: Article[];
};

let _articlesCache: Article[] | null = null;

export async function fetchArticles(): Promise<Article[]> {
  if (_articlesCache) return _articlesCache;
  const res = await fetch(`${API_URL}/philosophers/articles.json`);
  if (!res.ok) throw new Error(`Articles ${res.status}`);
  const data: ArticlesData = await res.json();
  _articlesCache = data.articles ?? [];
  return _articlesCache;
}

// ─── Ask the Thinkers (multi-voice AI consult) ─────────────────────────

export type PhilosopherProfile = {
  id: string;
  name: string;
  school?: string;
  key_ideas?: string[];
  key_works?: string[];
  famous_quote?: string;
  pull_quote?: string;
  article_excerpt?: string;
};

export type ConsultResponseItem = {
  id: string;
  name: string;
  response: string;
  suggested_book?: string | null;
};

export type AIConsultResponse = {
  responses: ConsultResponseItem[];
  error?: string | null;
};

/**
 * POST /api/ai/consult — ask up to three philosophers a question
 * and get each one's response in-character. Used by the Thinkers
 * "Ask" feature.
 */
export async function askThinkers(
  question: string,
  philosophers: PhilosopherProfile[]
): Promise<AIConsultResponse> {
  return apiFetch<AIConsultResponse>("/api/ai/consult", {
    method: "POST",
    body: JSON.stringify({ question, philosophers }),
  });
}

/** Turn a full Philosopher row into the trimmed profile the consult
 *  endpoint expects. Keeps the request payload small. */
export function toPhilosopherProfile(p: Philosopher): PhilosopherProfile {
  return {
    id: p.id,
    name: p.name,
    school: p.school ?? "",
    key_ideas: p.key_ideas ?? [],
    key_works: p.key_works ?? [],
    famous_quote: p.famous_quote ?? "",
    pull_quote: p.pull_quote ?? "",
    article_excerpt: (p.article ?? "").slice(0, 800),
  };
}
