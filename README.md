# Dastan — A Daily Canvas of World Art, Literature & Thought

> *"Dastan"* (Persian: داستان) means "story" — a word that has traveled through Farsi, Urdu, Turkish, and Arabic, carrying with it the ancient human impulse to share beauty across borders.

**Live at [mydastan.com](https://www.mydastan.com)**

---

## What Is Dastan?

In a world drowning in algorithmic noise, Dastan offers one painting, one page, one poem — each day. It is a digital museum that breathes slowly, a reading room that respects your attention, a companion for those who believe that a single brushstroke by Monet or a single paragraph by García Márquez can alter the texture of a day.

We do not compete for screen time. We create *screen meaning*.

---

## Features at a Glance

| Section | Route | What it is |
|---|---|---|
| **Today's Canvas** | `/` | The daily experience — painting, novel page, poem, and AI creative mode |
| **Gallery** | `/gallery` | Browse 2,300+ paintings across movements and artists |
| **Artists** | `/artists` | Long-form essays on 20 master painters |
| **Thinkers** | `/philosophers` | Philosophers timeline with voice fun-facts and AI consultation |
| **Reading Room** | `/little-prince`, `/siddhartha`, `/tao`, `/proust` | Full web readers for four of the Folio books (public, linked from `/signin`) |
| **Archive** | `/archive` | Revisit past days |
| **Saved** | `/favorites` | Your bookmarked paintings, passages, and poems |
| **Profile** | `/profile` | Preferences, avatar, account |

---

## Today's Canvas — The Four Pillars

Each day, Dastan presents four experiences, fetched in parallel (`asyncio.gather`) and rendered as a single contemplative page.

### 1. Painting of the Day
A masterwork from the global canon — Japanese ukiyo-e, Persian miniatures, Impressionism, Renaissance, Surrealism, Mexican muralism, and more. Paintings are sourced from a curated local collection and live museum APIs, matched to the user's preferred art movements.

- **Sources**: Curated local collection (2,371 paintings), Art Institute of Chicago API, Metropolitan Museum, Wikimedia Commons, Artvee, WikiArt (for copyrighted 20th-c. artists like Dalí)
- **Profile-guided**: rotates through user's preferred movements on each refresh
- **No repeats**: weighted random selection from the full qualifying pool with automatic cycle reset

### 2. One Page of a Global Novel
A single compelling passage (~150–250 words) from a great novel, selected by AI for beauty and emotional resonance. Fetched live from Project Gutenberg.

- **28 curated novels** spanning Dostoevsky, Austen, García Márquez, Kafka, Hedayat, Borges, and more
- **Smart passage extraction** with normalization and compelling-prose detection
- **Profile-matched**: novels scored by user's themes, genres, and regions
- **Background pre-warming** keeps popular texts cached in memory for instant passages

### 3. World Literature Highlight
A standalone poem fetched live from PoetryDB, matched to the user's literary tastes.

- **40+ poets** mapped by theme, region, and genre (Rumi, Hafez, Keats, Dickinson, Whitman, Neruda, Bashō, and more)
- **Smart filtering**: poems 4–40 lines, avoids the last 30 shown

### 4. AI Creative Mode
A Claude-generated poem or creative prompt inspired by the day's painting and literature.

- **Continue Writing**: users write a line and Claude extends their prose in the style of the day's literature
- **Ekphrastic writing**: AI responds to the painting with original verse

**Performance**: ~3–5s with warm caches (down from ~18s before parallelization).

---

## Gallery — `/gallery`

Browse the full painting collection in a lazy-loaded grid.

**Data flow:**
1. Source of truth: `paintings-collection/catalog.json` — 1,671 paintings, each with title, artist, year, movement, description, license, source URL, and local file path.
2. Images live under `paintings-collection/<movement>/<slug>.jpg` at 1200px width.
3. Backend route `GET /api/canvas/gallery` (`backend/app/api/routes/canvas.py`) reads the catalog, returns a random shuffled sample, and rewrites paths to `/collection/<file>` URLs served by FastAPI static.
4. Frontend gallery page requests this endpoint, renders cards with IntersectionObserver lazy-loading.

**How paintings get into the catalog:**
- `scripts/add-artist-paintings.py` — Wikidata SPARQL pipeline. For each target artist QID, it queries `?painting wdt:P170 ?artist` for the canonical list, fetches 1200px thumbnails from Wikimedia Commons, downloads unique images, and appends entries with `source: "wikidata"` and the Wikidata entity ID for dedup.
- Earlier batches came via Artvee, AIC, and Met bulk curators in `backend/app/services/`.

The gallery is **public** — guests can browse without signing in.

---

## Artists — `/artists`

Long-form essays on 20 master painters, from Leonardo to Frida Kahlo.

**Data flow:**
1. Source: `artists/catalog.json`
2. Each entry: `id`, `name`, `type`, `born`, `died`, `nationality`, `movement`, `key_works`, `article_title`, `article` (1,500–2,500 words, hand-written literary essay), `pull_quote`, `image`
3. Frontend page reads the JSON at build/request time and renders a card grid; each card opens a full essay page with a pull quote, era context, and the artist's portrait.

Essays are not AI-generated summaries — they are crafted prose, treating each painter as a subject worthy of a New Yorker profile. The gallery is **public**.

---

## Thinkers — `/philosophers`

A vertical timeline of 22 philosophers across five eras, each with a long-form essay, a voice-narrated fun fact, and an "ask them a question" consultation mode.

### Data

- Source: `philosophy/catalog.json`
- **22 philosophers**, grouped into **5 eras**: Ancient, Medieval, Early Modern, Modern, Contemporary
- Each philosopher has: `id`, `name`, `era`, `born`, `died`, `born_year`, `died_year`, `nationality`, `school`, `key_ideas`, `influenced_by`, `influenced`, `famous_quote`, `fun_fact`, `key_works`, `article_title`, `article`, `pull_quote`, `image`

### Timeline UI

- Chronological order, grouped by era with a banner header (era name, period pill, description, corner glyph watermark)
- A single continuous vertical line threads through each era's dot and down through each card
- Each card shows name, era, dates, school, key ideas, famous quote, and a pull quote
- **Voice fun-fact**: a speaker icon on each card. Click it to hear a short Claude-generated audio fact via the TTS endpoint (`/api/tts`)

### Ask a Thinker — AI Consultation

Users can select **up to 3 philosophers** and ask any question. Each selected thinker responds in character.

**Flow:**
1. User selects philosophers on the `/philosophers` page and types a question
2. Frontend calls `POST /api/ai/consult` with `{ question, philosophers: [{name, school, key_ideas, ...}] }` (`frontend/src/lib/api.ts` → `consultPhilosophers`)
3. Backend `ai_consult` handler in `backend/app/api/routes/ai.py` calls `_build_consult_prompt()` to construct a system prompt that:
   - Assigns Claude the voice of each selected philosopher
   - Loads each philosopher's tradition-specific vocabulary (Stoic `hegemonikon`, Epicurean `ataraxia`, Aristotelian `eudaimonia`, etc.)
   - Enforces a **60–90 word cap** per response
   - Matches temperament to school (the Stoic is stern, the Epicurean gentle, the Cynic blunt)
   - Bans therapy-speak, modern jargon, and breaking character
4. Claude returns a JSON array of in-character responses
5. Frontend renders each response as a card next to the philosopher's portrait

The result is not a summary of their ideas — it is an attempt at their voice.

---

## iOS App — React Native (Expo)

A native companion built in TypeScript with Expo Router, mirroring the web experience with a museum-editorial design language.

### Tabs
| Tab | What it is |
|-----|-----------|
| **Today** | Daily painting, novel page, poem — same 4 pillars as the web |
| **Gallery** | Two-column painting grid with swipeable lightbox |
| **Artists** | Salon-wall masonry of painter portraits + essays |
| **Thinkers** | Philosopher cards with voice fun-facts + Ask a Thinker |
| **Folio** | The reading room — 4 books + editorial article carousel |

### Folio — The Reading Room

Five curated books, each a full reader experience:

| Book | Author | Palette | Motif |
|------|--------|---------|-------|
| **Faal-e Hafez** | Hāfez (1389) | Oxblood & gold | Ghazal divination |
| **The Little Prince** | Saint-Exupéry (1943) | Deep navy & gold | Watercolor illustrations |
| **Siddhartha** | Hermann Hesse (1922) | Sumi-ink & stone | ॐ (Om) |
| **Tao Te Ching** | Lao Tzu (~400 BCE) | Forest jade & mist | 道 (Dao) |
| **In Search of Lost Time** | Marcel Proust (1913) | Belle époque rose | ❦ (fleuron) — French ↔ English side-by-side |

Each reader features: fade transitions between chapters, scroll-to-top on navigation, a progress rail, editorial pull quotes with a gold left-rule, and a chapter-jump strip. Catalogs are fetched from the production web origin (`www.mydastan.com/<book>/catalog.json`) so content stays in one place.

**Tap-to-top navigation**: on Gallery, Artists, and Thinkers tabs, tapping the already-active tab scrolls the list back to the top (standard iOS pattern, wired via `navigation.addListener("tabPress")`).

### Ask a Thinker — Book Suggestions

When consulting philosophers, each thinker now recommends a specific work from their bibliography that best addresses the reader's question. The suggestion appears below their in-character response.

### Design Details
- **Liquid Glass tab bar**: native `UIVisualEffectView` blur + gold hairline border, typographic glyphs instead of icons
- **Typography**: Cormorant Garamond (display), Crimson Pro (serif body), Inter (UI)
- **Auth**: Supabase with Keychain persistence via `expo-secure-store`
- **Profile wizard**: 6-step onboarding (avatar, name, art movements, themes, literary genres, regions)

---

## Design Philosophy

### The Museum Principle
A great museum does not overwhelm. It curates. Dastan places each piece of content in its own breathing room. No infinite scroll. No engagement traps.

### The Slowness Principle
Speed is the enemy of contemplation. Animations are unhurried. Transitions dissolve like watercolor. The UI never rushes you.

### Color System
```
Background:     #FDFBF7  (warm parchment)
Surface:        #F5F0E8  (aged linen)
Text Primary:   #2C2418  (rich sepia)
Text Secondary: #6B5D4D  (warm gray)
Accent:         #8B6914  (burnished gold)
Border:         #E8E0D0  (subtle warm)
```

### Typography
- **Headings**: Playfair Display — elegant serifs echoing book title pages
- **Body**: Source Serif 4 — warm, scholarly, highly readable
- **UI**: Inter — clean and invisible
- **Quotes**: Cormorant Garamond italic — the voice of poetry

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 (App Router) | SSR, Turbopack, React Server Components |
| **Styling** | Tailwind CSS v4 | Warm palette via custom design tokens |
| **Language** | TypeScript | Type safety across the stack |
| **Backend** | Python FastAPI | Async, fast, handles live API fetching |
| **Database** | PostgreSQL | Relational integrity for content + user data |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, migration-friendly |
| **Auth** | Supabase Auth | Email/password, JWT, cross-device sync |
| **AI** | Anthropic Claude API | Poem generation, passage selection, philosopher consultation, TTS prompts |
| **Content APIs** | PoetryDB, Project Gutenberg, AIC, Met Museum, Wikidata, Wikimedia Commons | Live content fetching and catalog building |
| **Deployment** | AWS EC2 + nginx + PM2 + Let's Encrypt | Production hosting with SSL |

---

## Architecture

```
dastan/
├── frontend/                  # Next.js 16 application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── page.tsx       # Today's Canvas (home)
│   │   │   ├── gallery/       # Painting gallery (public)
│   │   │   ├── artists/       # Artist essays (public)
│   │   │   ├── philosophers/  # Thinkers timeline + consult (public)
│   │   │   ├── archive/       # Browse past days
│   │   │   ├── favorites/     # Saved items
│   │   │   ├── profile/       # User preferences
│   │   │   ├── signin/        # Sign in (floating card design)
│   │   │   └── signup/        # Sign up
│   │   ├── components/
│   │   │   ├── ui/            # Design system (PaintingBackdrop, FavoriteButton, etc.)
│   │   │   ├── canvas/        # PaintingCard, NovelPageCard, LiteratureCard, AICreativeMode
│   │   │   └── layout/        # Header (with Artists & Thinkers nav), Footer
│   │   ├── lib/               # API client, Supabase, auth, types
│   │   └── styles/            # Global styles, fonts
│   └── public/                # Static assets
│
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── main.py            # App entry point, CORS, static mounts
│   │   ├── api/routes/
│   │   │   ├── canvas.py      # Today/refresh/archive + gallery + live fetching
│   │   │   ├── ai.py          # Creative mode + philosopher consult (_build_consult_prompt)
│   │   │   ├── tts.py         # Text-to-speech for thinker fun-facts
│   │   │   ├── profile.py     # User profile CRUD
│   │   │   └── favorites.py   # Favorites API
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic response schemas
│   │   ├── services/          # Curators, wiki collector, artvee collector
│   │   ├── db/                # Database config + seed
│   │   └── core/              # Settings, auth (JWT verification), database
│   └── requirements.txt
│
├── paintings-collection/      # 1,671 curated paintings + catalog.json
├── artists/                   # 20 artist essays + catalog.json
├── philosophy/                # 22 philosophers + catalog.json
├── hafez/                     # Hafez ghazals (bilingual)
├── ios/dastan/                # React Native (Expo) iOS app
│   ├── app/                   # Expo Router file-based routing
│   │   ├── (tabs)/            # Tab screens (Today, Gallery, Artists, Thinkers, Folio)
│   │   ├── library/           # Book readers (faal, little-prince, siddhartha, tao)
│   │   ├── artists/           # Artist detail [id]
│   │   ├── thinkers/          # Thinker detail [id], ask, article
│   │   ├── gallery/           # Lightbox [index]
│   │   ├── profile.tsx        # 6-step preference wizard
│   │   └── _layout.tsx        # Root stack navigator
│   ├── lib/                   # API client, auth, books, theme tokens
│   └── components/            # PaintingLoader, AppleSignInButton
├── scripts/                   # add-artist-paintings.py (Wikidata SPARQL), fetch-hafez.py
├── deploy/                    # nginx.conf, ecosystem.config.js, supabase-tables.sql
├── run.sh                     # Dev + deploy CLI
└── README.md
```

---

## How the Today Page Works

The Today page is the `GET /api/canvas/today` handler in `backend/app/api/routes/canvas.py`. It composes three content types (painting, novel page, verse) — each profile-scored, each with its own fallback chain. Novel and verse fetch in parallel via `asyncio.gather`.

### Profile shape
Set during the onboarding wizard (`/profile`), stored on `UserProfile`:
- `art_movements` — e.g. Impressionism, Surrealism, Ukiyo-e
- `themes` — love, nature, mythology, existentialism, dreams
- `regions` — Middle East, East Asia, Europe, Latin America
- `literary_genres` — poetry, mysticism, realism, etc.

### 1 · Painting (`canvas.py:340`, scorer `_find_in_collection` at `:124`)

```
cache check (per-date)
  → rotate to next art_movement (via _last_movement_index)
  → score every painting in paintings-collection/catalog.json:
       +10  category matches the preferred movement
       +6   painting's "movement" field text-matches
       +3   region/country match
       +2   loose relative (e.g. post-impressionism ↔ impressionism)
       +1   per tag overlap
     MIN_QUALITY = 8 to qualify
  → weighted random pick over all qualifiers (not just top-1)
  → falls back to DB row for today, then live AIC/Met fetch
```

The `_shown_collection` set skips titles served in this session; it resets once 70% of the catalog has been shown. Same-day refreshes rotate movements, so a user with `[impressionism, surrealism, ukiyo-e]` will see one from each genre across three refreshes before cycling.

### 2 · Novel page (`_fetch_live_novel` at `canvas.py:1132`)

Scores a hardcoded `_GUTENBERG_NOVELS` list (currently ~28 titles):

```
+5  region match (strongest signal)
+3  literary_genre match
+2  theme match
+2  already cached in memory (instant, no download)
−10 recently shown (last 15 in _recent_novels)
base: random.random() * 0.5
  → random pick from the top-5
  → fetch plain text from Project Gutenberg (cached)
  → _extract_passage_fallback picks a 40–400-word paragraph
```

### 3 · Verse (`_fetch_live_literature` at `canvas.py:857`)

Builds a candidate poet pool from profile:
- `themes` → `_POETS_BY_THEME`
- `regions` → `_POETS_BY_REGION`
- `literary_genres` → `_POETS_BY_GENRE`

If the pool is empty, defaults to Shakespeare, Keats, Dickinson, Whitman, Frost, Yeats, Shelley, Wordsworth, Poe.

```
random.choice(pool) → pick one poet
  → PoetryDB /author/{poet} query
  → filter to 4–40 line poems
  → exclude last 30 shown (_recent_poems)
  → random.choice(remaining)
```

This one is the weakest signal — it's poet-level uniform random, not per-poem scored. A profile theme that maps to 1 poet has equal weight with a theme mapping to 10.

### What runs after
Once the three items resolve, two more Claude calls run:
- `_build_ai_prompt_from_resp` builds the creative-mode prompt
- `_generate_mood_word` produces the single-word mood that appears at the top of the page
- `_save_canvas_history` persists (user, date, painting, novel, verse) to `UserCanvasHistory` for the Archive

### Refresh vs. first load
- **First load of the day**: cache miss → full pipeline runs.
- **Same-day re-open**: cache hit → instant return of the cached painting; novel and verse re-fetch.
- **Refresh button** (`fetchRefreshedCanvas`): clears the painting cache, rotates movement, re-runs everything.

### Gotchas / weak spots
- `_recent_*` trackers are **process-global** — two users share them.
- Novel list is a Python constant; growing it needs a code change.
- Verse scoring happens at poet level, not poem level — room for improvement.
- No cross-content "already shown today" lock, so painting/novel/verse pick independently.

---

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+

### Quick Start
```bash
# Start everything (backend + frontend)
./run.sh dev

# Or manually:

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure DB URL, API keys
python -m app.db.seed  # Seed starter content
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000**

---

## Deployment

Deployment is a single command:

```bash
./run.sh deploy remote
```

### What `run.sh deploy remote` does

All orchestrated from `run.sh` (`do_deploy_remote` function, line 317):

1. **SSH check** — verifies connectivity to the EC2 host (`ubuntu@98.84.165.121`)
2. **Provision** — idempotently ensures nginx, certbot, python3, PostgreSQL, Node.js 20, PM2, and build tools are installed
3. **PostgreSQL setup** — creates the `dastan` DB user and database if absent, configures `pg_hba` for local password auth
4. **Rsync code** — one-way sync from laptop → server, excluding `node_modules`, `venv`, `.git`, `__pycache__`, `.next`, logs, pids
5. **Backend** — creates/updates Python venv, installs `requirements.txt`, runs any DB migrations/seeds
6. **Frontend build** — `npm install` + `npm run build` on the server (Turbopack production build)
7. **Nginx config** — writes `deploy/nginx.conf` to `/etc/nginx/sites-available/dastan`, symlinks, and reloads
8. **SSL** — requests/renews Let's Encrypt certs for `mydastan.com` and `www.mydastan.com` via certbot
9. **PM2** — `pm2 start deploy/ecosystem.config.js --env production` (frontend + backend as PM2 processes), `pm2 save`, `pm2 startup systemd` for reboot persistence

### Other commands

```bash
./run.sh dev              # Start backend + frontend locally
./run.sh stop             # Stop local processes
./run.sh logs             # Tail local logs
./run.sh remote logs      # Tail production logs via SSH
./run.sh deploy local     # Build frontend locally without deploying
./run.sh deploy all       # Local build + remote deploy
```

### Infrastructure

- **Server**: AWS EC2 (Ubuntu) at `98.84.165.121`
- **Domain**: `mydastan.com` + `www.mydastan.com` via Let's Encrypt SSL
- **Process manager**: PM2 (auto-restart, log rotation, systemd integration)
- **Reverse proxy**: nginx (TLS termination, static file serving for `/collection/*`, API proxy to backend)
- **Database**: PostgreSQL 15, local to the EC2 instance
- **Auth**: Supabase (hosted)

---

## Roadmap

### Done
- [x] Today's Canvas with 4 pillars (painting, novel, poem, AI creative)
- [x] Live content fetching (PoetryDB, Project Gutenberg, museum APIs, Artvee, Wikidata SPARQL)
- [x] Parallel async refresh (~3–5s with `asyncio.gather` + async Anthropic client)
- [x] Profile-guided content selection with no-repeat tracking
- [x] Supabase auth (email/password) with floating-card signin/signup using shared `PaintingBackdrop`
- [x] Cross-device favorites and archive sync
- [x] Gallery view (1,671 paintings across 18+ movements, 60+ artists)
- [x] Artists section (20 long-form literary essays)
- [x] Thinkers timeline (22 philosophers, 5 eras, continuous era-themed lines)
- [x] Voice fun-facts on thinker cards (click to play, Claude TTS)
- [x] **Ask a Thinker** — consult up to 3 philosophers, in-character Claude responses
- [x] Header nav with Artists and Thinkers tabs (desktop + mobile bottom bar)
- [x] Painting collectors: Artvee, AIC/Met bulk curator, Wikimedia Commons, Wikidata SPARQL
- [x] Responsive design (iPhone Safari optimized)
- [x] Production deployment (AWS EC2 + nginx + PM2 + Let's Encrypt SSL)
- [x] AI poem generation (Sonnet for today, Haiku for fast refresh)
- [x] Background Gutenberg pre-warming for instant novel passages

- [x] **iOS app** — full React Native (Expo) companion with Liquid Glass tab bar
- [x] **Folio reading room** — 4 books (Faal-e Hafez, The Little Prince, Siddhartha, Tao Te Ching)
- [x] **Thinker book suggestions** — each philosopher recommends a relevant work with their response
- [x] Apple Sign-In (native nonce-based OAuth)

### Next
- [ ] Bilingual literature display (original language + English)
- [ ] Reading groups for serialized novels
- [ ] Community creative writing responses
- [ ] Audio narration of full literature passages
- [ ] Android app
- [ ] Multilingual UI

---

> *"The world is full of magic things, patiently waiting for our senses to grow sharper."*
> — W.B. Yeats

Dastan exists because beauty should be daily bread, not a luxury. Because a farmer in Punjab and a student in Oslo and a grandmother in São Paulo all deserve to encounter Hokusai's wave, Rumi's longing, and Toni Morrison's truth — one day at a time.

---

*Built with craft and intention.*
