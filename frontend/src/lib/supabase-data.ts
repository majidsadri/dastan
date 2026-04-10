import { createClient } from "./supabase";
import type { Favorite, ArchiveDay, TodayCanvas } from "./types";

// ═══════════════════════════════════════════════════════════
// FAVORITES — stored in Supabase for cross-device sync
// ═══════════════════════════════════════════════════════════

export async function fetchFavorites(): Promise<Favorite[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(toFavorite);
}

export async function addFavorite(
  itemType: string,
  title: string,
  subtitle: string | null,
  imageUrl: string | null,
  content: Record<string, unknown> = {}
): Promise<Favorite> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("favorites")
    .upsert(
      {
        user_id: user.id,
        item_type: itemType,
        title,
        subtitle,
        image_url: imageUrl,
        content,
      },
      { onConflict: "user_id,item_type,title" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toFavorite(data);
}

export async function removeFavorite(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("favorites").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function checkFavorite(
  itemType: string,
  title: string
): Promise<{ is_favorited: boolean; favorite_id: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { is_favorited: false, favorite_id: null };

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("title", title)
    .maybeSingle();

  if (data) return { is_favorited: true, favorite_id: data.id };
  return { is_favorited: false, favorite_id: null };
}

function toFavorite(row: Record<string, unknown>): Favorite {
  return {
    id: row.id as string,
    item_type: row.item_type as string,
    title: (row.title as string) || null,
    subtitle: (row.subtitle as string) || null,
    image_url: (row.image_url as string) || null,
    created_at: row.created_at as string,
  };
}


// ═══════════════════════════════════════════════════════════
// CANVAS HISTORY — stored in Supabase for cross-device sync
// ═══════════════════════════════════════════════════════════

export async function saveCanvasHistory(canvas: TodayCanvas): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Freeze-once semantics with one exception: if a legacy row exists that
  // has only denormalized metadata (no full `canvas` jsonb), we backfill
  // it. Once `canvas` is populated we never overwrite — that's the freeze
  // that guarantees the archive list and detail page stay consistent.
  const { data: existing } = await supabase
    .from("canvas_history")
    .select("id, canvas")
    .eq("user_id", user.id)
    .eq("canvas_date", canvas.date)
    .maybeSingle();

  const row = {
    user_id: user.id,
    canvas_date: canvas.date,
    // Full snapshot — source of truth for the archive detail page.
    canvas: canvas as unknown as Record<string, unknown>,
    // Denormalized metadata for list queries.
    painting_title: canvas.painting?.title || null,
    painting_artist: canvas.painting?.artist || null,
    painting_image_url: canvas.painting?.image_url || null,
    painting_year: canvas.painting?.year || null,
    painting_movement: canvas.painting?.movement || null,
    novel_title: canvas.novel_page?.novel_title || null,
    novel_author: canvas.novel_page?.author || null,
    novel_page: canvas.novel_page?.page_number || null,
    literature_title: canvas.literature?.title || null,
    literature_author: canvas.literature?.author || null,
    literature_genre: canvas.literature?.genre || null,
    mood_word: canvas.mood_word || null,
  };

  if (existing) {
    if (existing.canvas) return; // already frozen with full snapshot
    // Legacy row — backfill the canvas jsonb so the detail page stops
    // falling back to the rotating backend seed.
    const { error } = await supabase
      .from("canvas_history")
      .update(row)
      .eq("id", existing.id);
    if (error) console.error("Failed to backfill canvas history:", error.message);
    return;
  }

  const { error } = await supabase.from("canvas_history").insert(row);
  if (error) console.error("Failed to save canvas history:", error.message);
}

// Reads the user's frozen canvas snapshot for a given date.
// Returns null if the user has no snapshot for that date (they weren't
// around that day, or they're not signed in). Callers should fall back
// to the backend's global canvas route in that case.
export async function fetchCanvasSnapshotByDate(
  date: string
): Promise<TodayCanvas | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Select * so this query still succeeds even before the `canvas` jsonb
  // column migration has been applied to the Supabase instance.
  const { data, error } = await supabase
    .from("canvas_history")
    .select("*")
    .eq("user_id", user.id)
    .eq("canvas_date", date)
    .maybeSingle();

  if (error || !data) return null;

  // Prefer the full JSON snapshot when present.
  if (data.canvas) {
    return data.canvas as unknown as TodayCanvas;
  }

  // Legacy rows (pre-migration, or rows from seedArchiveTestData) stored
  // only denormalized metadata. Reconstruct a partial TodayCanvas from
  // those columns so the detail page shows the SAME painting / novel /
  // literature as the archive list — even though descriptions and full
  // text are missing. The cards render gracefully when those are empty.
  // We must NOT fall through to the backend's date route here, because
  // it would return whatever the seed pool currently rotates to, which
  // is the original consistency bug.
  return {
    date: data.canvas_date as string,
    painting: {
      id: 0,
      title: (data.painting_title as string) || "",
      artist: (data.painting_artist as string) || "",
      year: (data.painting_year as string) || "",
      origin_country: "",
      movement: (data.painting_movement as string) || "",
      image_url: (data.painting_image_url as string) || "",
      description: "",
      artist_bio: "",
      colors: [],
      display_date: data.canvas_date as string,
      created_at: "",
    },
    novel_page: {
      id: 0,
      novel_title: (data.novel_title as string) || "",
      author: (data.novel_author as string) || "",
      author_country: "",
      page_number: (data.novel_page as number) || 0,
      total_pages: 0,
      content: "",
      display_date: data.canvas_date as string,
      created_at: "",
    },
    literature: {
      id: 0,
      title: (data.literature_title as string) || "",
      author: (data.literature_author as string) || "",
      author_country: "",
      genre: (data.literature_genre as string) || "",
      content: "",
      original_language: "",
      original_text: null,
      display_date: data.canvas_date as string,
      created_at: "",
    },
    ai_prompt: "",
    mood_word: (data.mood_word as string) || null,
  };
}

export async function seedArchiveTestData(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const testDays = [
    { offset: 0, painting_title: "The Annunciation", painting_artist: "George Hitchcock", painting_image_url: "/collection/impressionism/george-hitchcock--the-annunciation.jpg", painting_year: "1887", painting_movement: "Impressionism", novel_title: "The Tale of Genji", novel_author: "Murasaki Shikibu", novel_page: 1, literature_title: "The Guest House", literature_author: "Jalal ad-Din Rumi", literature_genre: "mysticism", mood_word: "threshold" },
    { offset: 1, painting_title: "Mother\u2019s Goodnight Kiss", painting_artist: "Mary Cassatt", painting_image_url: "/collection/impressionism/mary-cassatt--mothers-goodnight-kiss.jpg", painting_year: "1888", painting_movement: "Impressionism", novel_title: "One Hundred Years of Solitude", novel_author: "Gabriel Garc\u00eda M\u00e1rquez", novel_page: 42, literature_title: "Invictus", literature_author: "William Ernest Henley", literature_genre: "poetry", mood_word: "tenderness" },
    { offset: 2, painting_title: "Glass and Checkerboard", painting_artist: "Juan Gris", painting_image_url: "/collection/cubism/juan-gris--glass-and-checkerboard-c-1917.jpg", painting_year: "1917", painting_movement: "Cubism", novel_title: "The Brothers Karamazov", novel_author: "Fyodor Dostoevsky", novel_page: 88, literature_title: "Ozymandias", literature_author: "Percy Bysshe Shelley", literature_genre: "poetry", mood_word: "fragment" },
    { offset: 3, painting_title: "The Laundress", painting_artist: "Pierre-Auguste Renoir", painting_image_url: "/collection/portrait/pierre-auguste-renoir--the-laundress.jpg", painting_year: "1878", painting_movement: "Impressionism", novel_title: "Pride and Prejudice", novel_author: "Jane Austen", novel_page: 15, literature_title: "Still I Rise", literature_author: "Maya Angelou", literature_genre: "poetry", mood_word: "grace" },
    { offset: 4, painting_title: "Mars Being Disarmed By Venus", painting_artist: "Jacques-Louis David", painting_image_url: "/collection/neoclassicism/jacques-louis-david--mars-being-disarmed-by-venus.jpg", painting_year: "1824", painting_movement: "Neoclassicism", novel_title: "Don Quixote", novel_author: "Miguel de Cervantes", novel_page: 103, literature_title: "If\u2014", literature_author: "Rudyard Kipling", literature_genre: "poetry", mood_word: "surrender" },
    { offset: 5, painting_title: "The Martyred Saint Sebastian", painting_artist: "Gustave Moreau", painting_image_url: "/collection/symbolism/gustave-moreau--the-martyred-saint-sebastian.jpg", painting_year: "1869", painting_movement: "Symbolism", novel_title: "Siddhartha", novel_author: "Hermann Hesse", novel_page: 27, literature_title: "The Road Not Taken", literature_author: "Robert Frost", literature_genre: "poetry", mood_word: "devotion" },
    { offset: 6, painting_title: "After the Bullfight", painting_artist: "Mary Cassatt", painting_image_url: "/collection/realism/mary-cassatt--after-the-bullfight.jpg", painting_year: "1873", painting_movement: "Realism", novel_title: "Anna Karenina", novel_author: "Leo Tolstoy", novel_page: 56, literature_title: "Desiderata", literature_author: "Max Ehrmann", literature_genre: "prose poetry", mood_word: "aftermath" },
    { offset: 7, painting_title: "Coffeepot", painting_artist: "Juan Gris", painting_image_url: "/collection/cubism/juan-gris--coffeepot.jpg", painting_year: "1916", painting_movement: "Cubism", novel_title: "The Great Gatsby", novel_author: "F. Scott Fitzgerald", novel_page: 34, literature_title: "Howl", literature_author: "Allen Ginsberg", literature_genre: "poetry", mood_word: "stillness" },
    { offset: 8, painting_title: "Cornelis de Vos", painting_artist: "Anthony van Dyck", painting_image_url: "/collection/baroque/anthony-van-dyck--cornelis-de-vos.jpg", painting_year: "1627", painting_movement: "Baroque", novel_title: "Wuthering Heights", novel_author: "Emily Bront\u00eb", novel_page: 71, literature_title: "The Waste Land", literature_author: "T.S. Eliot", literature_genre: "poetry", mood_word: "nobility" },
    { offset: 9, painting_title: "Scenes from the Life of Saint John", painting_artist: "Bartolomeo di Giovanni", painting_image_url: "/collection/renaissance/bartolomeo-di-giovanni--scenes-from-the-life-of-saint-john-the-baptis.jpg", painting_year: "1490", painting_movement: "Renaissance", novel_title: "Crime and Punishment", novel_author: "Fyodor Dostoevsky", novel_page: 112, literature_title: "Ode to a Nightingale", literature_author: "John Keats", literature_genre: "poetry", mood_word: "revelation" },
    { offset: 10, painting_title: "Serment Du Jeu De Paume", painting_artist: "Jacques-Louis David", painting_image_url: "/collection/neoclassicism/jacques-louis-david--serment-du-jeu-de-paume-le-20-juin-1789.jpg", painting_year: "1791", painting_movement: "Neoclassicism", novel_title: "Les Mis\u00e9rables", novel_author: "Victor Hugo", novel_page: 201, literature_title: "Dulce et Decorum Est", literature_author: "Wilfred Owen", literature_genre: "poetry", mood_word: "defiance" },
    { offset: 11, painting_title: "Head of Christ", painting_artist: "Petrus Christus", painting_image_url: "/collection/portrait/petrus-christus--head-of-christ-ecce-homo.jpg", painting_year: "1445", painting_movement: "Early Netherlandish", novel_title: "The Name of the Rose", novel_author: "Umberto Eco", novel_page: 89, literature_title: "Psalm 23", literature_author: "King David", literature_genre: "sacred text", mood_word: "solace" },
    { offset: 12, painting_title: "The Funeral of Patroclus", painting_artist: "Jacques-Louis David", painting_image_url: "/collection/neoclassicism/jacques-louis-david--the-funeral-of-patroclus.jpg", painting_year: "1778", painting_movement: "Neoclassicism", novel_title: "The Iliad", novel_author: "Homer", novel_page: 155, literature_title: "Do Not Go Gentle", literature_author: "Dylan Thomas", literature_genre: "poetry", mood_word: "mourning" },
    { offset: 13, painting_title: "Harriett Pullman Carolan", painting_artist: "John Singer Sargent", painting_image_url: "/collection/portrait/john-singer-sargent--harriett-pullman-carolan.jpg", painting_year: "1911", painting_movement: "Portraits", novel_title: "The Age of Innocence", novel_author: "Edith Wharton", novel_page: 48, literature_title: "Sonnet 18", literature_author: "William Shakespeare", literature_genre: "sonnet", mood_word: "elegance" },
  ];

  const today = new Date();
  const rows = testDays.map((d) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d.offset);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      user_id: user.id,
      canvas_date: dateStr,
      painting_title: d.painting_title,
      painting_artist: d.painting_artist,
      painting_image_url: d.painting_image_url,
      painting_year: d.painting_year,
      painting_movement: d.painting_movement,
      novel_title: d.novel_title,
      novel_author: d.novel_author,
      novel_page: d.novel_page,
      literature_title: d.literature_title,
      literature_author: d.literature_author,
      literature_genre: d.literature_genre,
      mood_word: d.mood_word,
    };
  });

  const { error } = await supabase
    .from("canvas_history")
    .upsert(rows, { onConflict: "user_id,canvas_date" });

  if (error) throw new Error(error.message);
  return rows.length;
}

export async function fetchArchive(): Promise<ArchiveDay[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("canvas_history")
    .select("*")
    .eq("user_id", user.id)
    .order("canvas_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    date: row.canvas_date,
    painting_title: row.painting_title,
    painting_artist: row.painting_artist,
    painting_image_url: row.painting_image_url,
    painting_movement: row.painting_movement || null,
    novel_title: row.novel_title,
    novel_page: row.novel_page,
    literature_title: row.literature_title,
    literature_author: row.literature_author,
    mood_word: row.mood_word || null,
  }));
}
