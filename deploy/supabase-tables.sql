-- Supabase tables for cross-device sync of favorites and canvas history
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ═══════════════════════════════════════════════════════════
-- FAVORITES
-- ═══════════════════════════════════════════════════════════
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  item_type text not null check (item_type in ('painting', 'novel', 'literature')),
  title text,
  subtitle text,
  image_url text,
  content jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Prevent duplicate favorites per user
create unique index if not exists favorites_user_type_title
  on public.favorites (user_id, item_type, title);

-- Fast lookup by user
create index if not exists favorites_user_id_idx
  on public.favorites (user_id);

-- Row Level Security
alter table public.favorites enable row level security;

create policy "Users can view own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- CANVAS HISTORY (archive)
-- ═══════════════════════════════════════════════════════════
-- Each row is a frozen snapshot of one user's canvas for one day.
-- The `canvas` jsonb column holds the full TodayCanvas object — so the
-- archive list AND the archive detail page read the exact same data,
-- and cross-device consistency is guaranteed (any device the user signs
-- into sees the same saved canvas).
create table if not exists public.canvas_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  canvas_date date not null,
  -- Full canvas snapshot (painting, novel_page, literature, ai_prompt, mood_word).
  -- Source of truth for the archive detail page.
  canvas jsonb,
  -- Denormalized metadata for fast list queries without JSON traversal.
  painting_title text,
  painting_artist text,
  painting_image_url text,
  painting_year text,
  painting_movement text,
  novel_title text,
  novel_author text,
  novel_page integer,
  literature_title text,
  literature_author text,
  literature_genre text,
  mood_word text,
  created_at timestamptz default now() not null
);

-- Migration for existing deployments: add canvas column if missing
alter table public.canvas_history
  add column if not exists canvas jsonb;

-- One entry per user per date
create unique index if not exists canvas_history_user_date
  on public.canvas_history (user_id, canvas_date);

create index if not exists canvas_history_user_id_idx
  on public.canvas_history (user_id);

-- Row Level Security
alter table public.canvas_history enable row level security;

create policy "Users can view own history"
  on public.canvas_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.canvas_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own history"
  on public.canvas_history for update
  using (auth.uid() = user_id);
