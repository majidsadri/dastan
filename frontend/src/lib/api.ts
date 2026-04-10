import { DailyContent, UserProfile } from "./types";
import { createClient } from "./supabase";

// Re-export Supabase-backed favorites and archive for cross-device sync
import {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  fetchArchive,
  saveCanvasHistory,
  fetchCanvasSnapshotByDate,
  seedArchiveTestData,
} from "./supabase-data";

export {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  fetchArchive,
  saveCanvasHistory,
  fetchCanvasSnapshotByDate,
  seedArchiveTestData,
};

// Always use relative URLs — Next.js rewrites /api/* to the backend in dev,
// and nginx proxies /api/* in production. No cross-origin issues.
const BASE_URL = "";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const url = `${BASE_URL}${path}`;
  console.log("[apiFetch]", url);
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTodayCanvas(): Promise<DailyContent> {
  return apiFetch<DailyContent>("/api/canvas/today");
}

export async function fetchCanvasByDate(date: string): Promise<DailyContent> {
  // Prefer the user's frozen Supabase snapshot — that's what the archive
  // list was rendered from, so the detail page must read the same source
  // to stay consistent. Falls back to the backend's global canvas only
  // when the user has no snapshot for this date (guest, or pre-signup).
  const snapshot = await fetchCanvasSnapshotByDate(date);
  if (snapshot) {
    return { canvas: snapshot, message: `Canvas for ${date}.` };
  }
  return apiFetch<DailyContent>(`/api/canvas/date/${date}`);
}

export async function fetchRefreshedCanvas(): Promise<DailyContent> {
  return apiFetch<DailyContent>("/api/canvas/refresh");
}


export async function fetchProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

async function saveProfileToSupabase(data: Omit<UserProfile, "id" | "created_at" | "updated_at">): Promise<UserProfile> {
  const supabase = createClient();
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
  // Sync to backend for curation — awaited so Safari doesn't kill it
  await syncProfileToBackend(data).catch(() => {});
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

async function syncProfileToBackend(data: Omit<UserProfile, "id" | "created_at" | "updated_at">): Promise<void> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
        // keepalive ensures the request survives page navigation on Safari
        keepalive: true,
      });
      if (res.status === 404) {
        await fetch(`${BASE_URL}/api/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(data),
          keepalive: true,
        });
      }
      return; // success
    } catch {
      if (attempt === maxRetries) return;
      // Brief delay before retry
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

export async function createProfile(data: Omit<UserProfile, "id" | "created_at" | "updated_at">): Promise<UserProfile> {
  return saveProfileToSupabase(data);
}

export async function updateProfile(data: Omit<UserProfile, "id" | "created_at" | "updated_at">): Promise<UserProfile> {
  return saveProfileToSupabase(data);
}

export async function curateCanvas(): Promise<{
  curated: number;
  paintings: Array<{ title: string; artist: string; date: string; source: string; query: string }>;
  queries: string[];
  profile: string;
  error?: string;
}> {
  return apiFetch("/api/canvas/curate", { method: "POST" });
}

export async function generateCreative(
  mode: string,
  paintingContext: string,
  literatureContext: string,
  userInput: string = ""
): Promise<{ content: string; mode: string; label: string }> {
  return apiFetch<{ content: string; mode: string; label: string }>("/api/ai/creative", {
    method: "POST",
    body: JSON.stringify({
      mode,
      painting_context: paintingContext,
      literature_context: literatureContext,
      user_input: userInput,
    }),
  });
}

export async function speakText(
  text: string,
  voice: string = "Achernar",
  prompt: string = "Read this poem aloud slowly and beautifully, with feeling"
): Promise<Blob> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/tts/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ text, voice, prompt }),
  });
  if (!res.ok) throw new Error(`TTS error: ${res.status}`);
  return res.blob();
}

export interface ConsultPhilosopherProfile {
  id: string;
  name: string;
  school?: string;
  key_ideas?: string[];
  famous_quote?: string;
  pull_quote?: string;
  article_excerpt?: string;
}

export interface ConsultResponseItem {
  id: string;
  name: string;
  response: string;
}

export async function consultPhilosophers(
  question: string,
  philosophers: ConsultPhilosopherProfile[]
): Promise<{ responses: ConsultResponseItem[]; error?: string }> {
  return apiFetch<{ responses: ConsultResponseItem[]; error?: string }>(
    "/api/ai/consult",
    {
      method: "POST",
      body: JSON.stringify({ question, philosophers }),
    }
  );
}

export async function continueWriting(
  text: string,
  paintingContext: string,
  literatureContext: string
): Promise<{ continuation: string; style_note: string }> {
  return apiFetch<{ continuation: string; style_note: string }>("/api/ai/continue", {
    method: "POST",
    body: JSON.stringify({
      text,
      painting_context: paintingContext,
      literature_context: literatureContext,
    }),
  });
}
