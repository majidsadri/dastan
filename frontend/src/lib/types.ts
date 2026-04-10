export interface Painting {
  id: number;
  title: string;
  artist: string;
  year: string;
  origin_country: string;
  movement: string;
  image_url: string;
  description: string;
  artist_bio: string;
  colors: string[];
  display_date: string;
  created_at: string;
}

export interface NovelPage {
  id: number;
  novel_title: string;
  author: string;
  author_country: string;
  page_number: number;
  total_pages: number;
  content: string;
  display_date: string;
  created_at: string;
}

export interface LiteratureHighlight {
  id: number;
  title: string;
  author: string;
  author_country: string;
  genre: string;
  content: string;
  original_language: string;
  original_text: string | null;
  display_date: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  item_type: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  created_at: string;
}

export interface TodayCanvas {
  date: string;
  painting: Painting;
  novel_page: NovelPage;
  literature: LiteratureHighlight;
  ai_prompt: string;
  mood_word: string | null;
}

export interface DailyContent {
  canvas: TodayCanvas;
  message: string;
}

export interface UserProfile {
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
}

export interface ArchiveDay {
  date: string;
  painting_title: string | null;
  painting_artist: string | null;
  painting_image_url: string | null;
  painting_movement: string | null;
  novel_title: string | null;
  novel_page: number | null;
  literature_title: string | null;
  literature_author: string | null;
  mood_word: string | null;
}
