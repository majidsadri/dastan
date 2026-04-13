# Dastan iOS App — Planning & Build Guide

> *"Every day, a new tale."* — Dastan is a daily canvas of art, literature, philosophy, and Persian poetry. This document covers what it takes to ship it as a native iOS app.

---

## TL;DR — How hard is this?

**Moderate.** Not trivial, not terrifying. The backend is plain REST — no websockets, no SSE, no GraphQL, no server-side rendering that matters — so any iOS client can talk to it unchanged. The web frontend is standard React + Tailwind with only a handful of browser-only APIs (`IntersectionObserver`, `HTMLAudioElement`, touch events). Supabase has a first-party JS SDK that runs on every JS runtime and an official Swift SDK for native builds.

The real challenges are:

1. **Audio**: TTS streams from `/api/tts/speak` (WAV or MP3) and plays alongside a looping setar ambient bed. This needs `AVAudioPlayer` + `AVAudioSession` on iOS, including background-audio entitlement and interruption handling (phone calls, other apps).
2. **Asset footprint**: `frontend/public/` is ~98 MB, mostly the painting catalog. Bundling it into the `.ipa` is a non-starter — App Store caps, review friction, update pain. Images must be served over the network from the existing backend (they already are) with a smart on-device cache.
3. **Supabase session persistence**: The web app leans on browser storage; on iOS you need Keychain-backed session storage so the user stays signed in across launches.
4. **RTL + Farsi typography**: Faal-e Hafez renders Farsi in Noto Naskh Arabic. iOS handles RTL natively but the custom font must be shipped and wired up.
5. **Swipe-first navigation**: The home page uses touch gestures to move between Canvas / One Page / Verse / Faal tabs. That's trivial on iOS, but only if you design for it up front.

None of this is a blocker. All of it is work.

---

## 1. What the app does

Dastan is a web app at https://www.mydastan.com with these main surfaces:

| Surface | What it is |
|---|---|
| **Today** | Daily canvas — one painting, one novel excerpt, one piece of literature, one Faal-e Hafez poem, rotated daily. Swipe to move between tabs. |
| **Gallery** | Masonry grid of ~1000 paintings, filterable by 15 art movements. |
| **Artists** | Grid of artist profiles; tap to see bio + their works. |
| **Thinkers (Philosophers)** | Grid of ~15 philosophers; tap to read a long-form biographical article, key ideas, pull quotes, famous quote, fun fact, and a per-philosopher illustration. |
| **Faal** | Dedicated Faal-e Hafez divination page. Persian poem + English translation, TTS in both languages, setar ambient bed. |
| **Archive** | User's past daily canvases, frozen per day in Supabase. |
| **Favorites** | User's saved paintings, novels, poems. |
| **Profile** | Display name, avatar, art/literature preferences that bias the daily rotation. |
| **Sign in / Sign up** | Supabase email + password. |
| **AI modes** | "Continue" (AI continues user text in today's style), "Creative" (haiku / micro-story / dialogue / ekphrasis), "Consult" (ask 1–3 philosophers a question; returns their individual answers, supports Persian questions for Persian philosophers). |

The backend is FastAPI + SQLAlchemy + Postgres (seed pool) and uses Supabase for auth, user favorites, and frozen canvas history.

---

## 2. Architecture of the existing app

```
┌────────────────────┐     HTTPS      ┌──────────────────────┐
│  Next.js 16 front  │ ──────────────▶│  FastAPI backend     │
│  (React + Tailwind)│                │  (Python + SQLA)     │
└──────────┬─────────┘                └──────────┬───────────┘
           │                                     │
           │ JWT (Bearer)                        │ SQLAlchemy
           │                                     │
           ▼                                     ▼
┌────────────────────┐                ┌──────────────────────┐
│  Supabase          │                │  Postgres            │
│  (auth, favorites, │                │  (painting/novel/lit │
│   canvas_history)  │                │   seed pool)         │
└────────────────────┘                └──────────────────────┘
           ▲                                     │
           │                                     │
           │                                     ▼
           │                          ┌──────────────────────┐
           └──────── RLS policies ───▶│  3rd-party APIs      │
                                      │  • Anthropic Claude  │
                                      │  • Gemini 2.5 Flash  │
                                      │  • OpenAI TTS        │
                                      │  • PoetryDB          │
                                      │  • Gutenberg         │
                                      │  • MET, Art Inst.    │
                                      └──────────────────────┘
```

**Key observation:** the iOS app only needs to replace the Next.js frontend. Everything behind it (backend, Postgres, Supabase, third parties) stays exactly as it is. That's the single biggest reason this port is feasible at all.

---

## 3. Three ways to build the iOS app

### Option A — Capacitor wrap of the existing web app

Wrap the existing Next.js frontend (or a static-exported SPA version of it) in [Capacitor](https://capacitorjs.com/), ship as a native iOS shell with a WebView inside.

**Pros**
- Reuses the entire existing codebase — every page, every component, every Tailwind token.
- New features stay unified: write once, works on web and iOS.
- Supabase JS SDK already works; minimal auth rework.
- Fastest path to something you can install on a phone.

**Cons**
- WebView performance is noticeably worse than native for scroll-heavy surfaces (Gallery with 1000 paintings will stutter).
- TTS audio playback needs a native plugin; `HTMLAudioElement` inside a WKWebView is flaky for streamed audio and cannot survive app backgrounding without a native bridge.
- `IntersectionObserver` works in WKWebView but lazy-loading behaviour differs from Safari.
- App Store reviewers sometimes reject "repackaged websites" under guideline 4.2. You need enough native features (push, offline, native audio) to clear the bar.
- Supabase session needs Keychain persistence through `@capacitor/preferences` or a custom plugin.

**Verdict:** Fastest MVP. Highest risk of App Store rejection. Highest cost per screen later if you need native polish.

### Option B — React Native / Expo rewrite

Rewrite the UI layer in React Native using Expo. Keep the `api.ts`, `supabase-data.ts`, types, and business logic. Replace every component.

**Pros**
- Native-feeling scroll, gestures, navigation — uses real `UICollectionView` / `UIScrollView` under the hood.
- `expo-av` handles streaming TTS and ambient audio cleanly with background audio support.
- Can share the data layer and types between web and mobile if you extract them to a shared package.
- Strong path to Android later if desired.
- Keychain + secure storage via `expo-secure-store` is a one-liner for Supabase session persistence.

**Cons**
- Every screen has to be rebuilt from scratch — Tailwind classes, custom fonts, masonry layouts, modals. No `div`s.
- You will end up with two codebases to maintain (web and mobile) unless you go all-in on a design system shared across both.
- React Native upgrades are painful.

**Verdict:** Best balance of effort vs. native quality. Recommended default.

### Option C — Full native SwiftUI

Rebuild the app natively in SwiftUI with Supabase-swift.

**Pros**
- Best possible performance and native integration (Dynamic Island, widgets, Live Activities, Shortcuts, Share Sheet, Siri).
- Smallest binary, smallest memory footprint.
- Access to everything Apple ships this year.
- App Store review is frictionless.

**Cons**
- Every piece of UI and client-side logic is rewritten. Nothing from the web app is reusable.
- AI client libraries are worse in Swift than in Python/JS; anything AI-related has to go through your backend anyway (which is already true).
- Requires an engineer fluent in Swift/SwiftUI and `async/await` Swift concurrency.

**Verdict:** The right call if Dastan is going to be an iOS-first product long-term. Overkill if iOS is a secondary surface.

### Recommendation

**Start with Option B (React Native + Expo).** It gives you real native UX, shares the data layer with the web app, and lets you ship a version you're not embarrassed by. Drop to Option A only if you need something in testers' hands this week. Promote to Option C only if iOS revenue justifies a full native team.

The rest of this document assumes Option B unless noted.

---

## 4. Feature-by-feature difficulty breakdown

| Feature | Difficulty | Notes |
|---|---|---|
| Sign in / sign up (Supabase) | **Easy** | `@supabase/supabase-js` + `expo-secure-store` for token persistence. |
| Today page (4 tabs + swipe) | **Easy–Medium** | `react-native-pager-view` or `react-native-tab-view`. Cards are straightforward. |
| Painting card | **Easy** | `expo-image` for caching. |
| Novel page card | **Easy** | Plain text + typography. |
| Literature card | **Easy** | Plain text. |
| Faal card (Persian + TTS + ambient) | **Hard** | Streaming audio, ambient bed, RTL Farsi typography, custom font, TTS interruption handling. Plan for a week of focused work. |
| Gallery (1000 paintings, filters) | **Medium** | `FlashList` for virtualized grid. Image caching critical. |
| Artists grid + detail | **Easy–Medium** | Straightforward grid + detail. |
| Thinkers grid + detail | **Medium** | Long-form article rendering. Custom per-philosopher illustrations. Pull quotes, drop caps. |
| Archive list + day detail | **Easy** | Supabase query + rendering. |
| Favorites | **Easy** | Supabase CRUD. |
| Profile (preferences) | **Easy** | Form with multi-select chips. |
| AI Continue / Creative / Consult | **Easy** | Just HTTP calls to the existing backend. |
| Offline fallback | **Medium** | Cache last-seen canvas + favourites locally. Ship *some* offline UX; don't show a blank screen on a subway. |
| Push notifications (daily canvas reminder) | **Medium** | Requires backend work too — APNs + device token registration table. Not in MVP. |
| Widgets (today's painting on the home screen) | **Medium** | SwiftUI widget extension, even in an RN app. Post-MVP. |
| Share sheet (share a painting / poem) | **Easy** | `expo-sharing` / `Share` API. |
| Deep links (dastan://painting/123) | **Easy** | `expo-linking`. |
| Dark mode | **Easy** | Already in the Tailwind palette; map to RN themes. |

**Hardest single feature**: the Faal card. Everything else in this app is a well-understood iOS pattern.

---

## 5. Step-by-step build plan (Option B: React Native + Expo)

### Phase 0 — Groundwork (do this regardless of approach)

1. **Extract shared code from the web frontend.** Pull `frontend/src/lib/api.ts`, `frontend/src/lib/types.ts`, `frontend/src/lib/supabase.ts`, and `frontend/src/lib/supabase-data.ts` into a new package: `packages/dastan-core/`. Make them framework-free (no JSX, no Next.js imports). Both the web app and the iOS app will consume this package.
2. **Document the backend API contract.** The backend already has FastAPI auto-generated OpenAPI at `/docs`. Export the OpenAPI JSON and commit it to `ios/openapi.json`. Regenerate TypeScript types from it (`openapi-typescript`) so the iOS client uses the exact same types as the backend.
3. **Audit the asset pipeline.** Confirm `public/collection/**/*.jpg` is served from the backend or a CDN in production, not bundled with the Next.js build. This is already the case (nginx serves `/collection/*` from the deploy directory) but re-verify before the mobile build.
4. **Add CORS entries for the new app origins.** Look at `backend/app/main.py`'s CORS middleware. For iOS, Capacitor uses `capacitor://localhost` and Expo uses `http://localhost:8081` in dev. Both need to be in the allow-list.

### Phase 1 — Scaffold the Expo app

```bash
cd /Users/sizarta/dastan/ios
npx create-expo-app dastan --template blank-typescript
cd dastan
npx expo install expo-router react-native-safe-area-context \
    react-native-screens react-native-gesture-handler \
    react-native-reanimated expo-secure-store expo-image \
    expo-av expo-font expo-linking expo-splash-screen \
    @supabase/supabase-js @shopify/flash-list
```

Add `expo-router` so file-based routing mirrors the Next.js app structure. That makes feature parity easier to track.

### Phase 2 — Auth & data layer

1. Create `app/_layout.tsx` with an `AuthProvider` that mirrors `frontend/src/lib/auth.tsx`. Use `expo-secure-store` as the Supabase storage adapter:
   ```ts
   import * as SecureStore from "expo-secure-store";
   createClient(url, key, {
     auth: { storage: { getItem, setItem, removeItem }, /* ... */ }
   });
   ```
2. Import the `dastan-core` package and re-export `fetchTodayCanvas`, `fetchArchive`, `fetchFavorites`, `addFavorite`, `removeFavorite`, `checkFavorite`, `saveCanvasHistory`. No code changes required — these are plain `fetch()` calls against the backend.
3. Wire up a single app-wide `apiFetch` that injects the bearer token and points at the production backend URL (with an EAS-managed env variable for staging vs. prod).

### Phase 3 — Screens, cheapest first

Build in this order. Each screen below is small enough to land in a single PR.

1. **Sign in / sign up** — validate the auth layer end-to-end.
2. **Today → Painting tab only** — just an image + title + artist. No swipe yet.
3. **Today → all four tabs + swipe** — swap in `react-native-pager-view`.
4. **Favorites** — Supabase CRUD + optimistic UI.
5. **Archive list + day detail.**
6. **Gallery** — `FlashList` with 2-column grid, `expo-image` for caching.
7. **Artists list + detail.**
8. **Thinkers list + detail** — re-use the per-philosopher illustrations from `frontend/public/philosophers/scenes/` (they're already on the server).
9. **Profile.**
10. **AI Continue / Creative / Consult** — reuse the existing backend endpoints.

### Phase 4 — Faal card (the hard one)

Budget a focused week.

1. **Set the audio session** in `app.json` → `ios.infoPlist.UIBackgroundModes: ["audio"]`. Add a `Configure Audio Session` step at app startup using `Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true, interruptionModeIOS: InterruptionModeIOS.DoNotMix })`.
2. **TTS playback**:
   ```ts
   const { sound } = await Audio.Sound.createAsync(
     { uri: `${API}/api/tts/speak`, headers: { Authorization: `Bearer ${token}` } },
     { shouldPlay: true }
   );
   ```
   Note that `expo-av` streams the response directly; no need to cache the blob first. Supabase TTS response is always <200 KB per poem, so this is fine.
3. **Ambient setar bed**: a second `Audio.Sound` instance pointing at `/audio/setar-ambient.mp3`, `isLooping: true`, `volume: 0.35`. Start before TTS, crossfade out when TTS stops.
4. **Farsi typography**: ship Noto Naskh Arabic via `expo-font`. Set `writingDirection: "rtl"` on Farsi `<Text>` components. Use `I18nManager.isRTL` only if you intend to flip the whole app — you probably don't, so leave it alone and handle Farsi at the component level.
5. **Interruption handling**: subscribe to `Audio.setOnPlaybackStatusUpdate` and pause/resume cleanly on phone calls and other app audio.

### Phase 5 — Polish & ship

- **Splash screen + app icon**: use `dastan_icon_1024x1024.png` (already in the repo root) as the seed.
- **Offline fallback**: cache the last-loaded canvas and favourites in `AsyncStorage`. Show "last seen yesterday" messaging when offline.
- **Error reporting**: add Sentry (`@sentry/react-native`). Backend is already noisy; make sure the client is too.
- **TestFlight build**: `eas build --platform ios --profile preview`, upload, invite testers.
- **App Store submission**: write the privacy policy (Supabase stores email + user content; Gemini/OpenAI process TTS requests; Claude processes AI prompts). Prepare the App Privacy nutrition label — see Phase 6.

### Phase 6 — App Store requirements you will forget

- **Privacy manifest** (`PrivacyInfo.xcprivacy`): required as of iOS 17. Declare every third-party SDK that collects user data. Supabase, Sentry, and any analytics all need entries.
- **App Tracking Transparency**: not required unless you actually track users. Don't add analytics you don't need.
- **Sign in with Apple**: required if you offer any third-party social sign-in. Supabase email/password alone is fine — no Sign in with Apple needed until you add Google/Facebook/etc.
- **Content moderation**: if the AI Consult feature generates text, reviewers will ask how you prevent abuse. Have a canned answer: "content is generated by Anthropic Claude with a philosopher system prompt and passes through OpenAI moderation before display" — whether or not that's true today, be ready to add it.
- **Age rating**: probably 9+ (mild literary themes). Some Rilke will cross into 12+.
- **Export compliance**: using standard HTTPS only, no custom crypto → `ITSAppUsesNonExemptEncryption: false` in `Info.plist`. Save yourself a day of paperwork.

---

## 6. Critical risks & gotchas

### 6.1 TTS audio over HTTPS with a Bearer token

`AVPlayer` and `expo-av` both support authenticated HTTPS audio streams, but you have to pass the header through. Test early with a real Gemini/OpenAI response, not a local MP3 — behaviour differs.

### 6.2 Setar ambient during TTS

Two simultaneous audio sources on iOS is allowed only if you configure the audio session with a mix-compatible category. Use `AVAudioSessionCategoryPlayback` + `.mixWithOthers` option. Without this, starting the second `Audio.Sound` will stop the first.

### 6.3 Supabase session across launches

The JS SDK defaults to `localStorage`, which doesn't exist in React Native. You must provide a storage adapter backed by `expo-secure-store` (preferred) or `@react-native-async-storage/async-storage` (less secure). Without this, every app launch requires re-login.

### 6.4 Large image catalog

Do not bundle `frontend/public/collection/**` into the app. Serve from the backend with `Cache-Control: public, max-age=2592000` (30 days) and let `expo-image` cache on disk. Alternatively, front the backend with Cloudflare and lean on its image optimization.

### 6.5 Backend CORS

The existing CORS middleware allows `mydastan.com`. For Expo dev you'll hit the backend from `http://localhost:8081` and `exp://<lan-ip>:8081`. For production, the iOS app doesn't send an `Origin` header at all (WKWebView via Capacitor does, native fetch does not), so CORS is typically a non-issue on device. But it bites in dev. Add an allow-list entry for Expo dev or disable CORS for `/api/*` when `DASTAN_ENV=dev`.

### 6.6 Backend rate limits

The daily canvas endpoint is expensive (calls Claude for poetry generation, PoetryDB, Gutenberg). Once you have a real iOS app hammering it, you'll want:
- An on-device cache with a 6-hour TTL for `/api/canvas/today` keyed by `(date, user_id)`.
- A backend Redis cache keyed the same way.

Neither exists today. Add them in Phase 5.

### 6.7 Farsi text rendering

React Native's default text layout engine handles RTL correctly but requires explicit `textAlign: "right"` and `writingDirection: "rtl"` on Farsi text blocks. Without these, Farsi reads left-to-right, which is wrong and offensive. Test every Farsi surface with a native speaker before shipping.

### 6.8 TestFlight expiry

TestFlight builds expire after 90 days. Plan your testing cadence so you don't lock testers out mid-cycle.

### 6.9 Push notification entitlement

Not needed for MVP, but if you plan to add "today's canvas is ready" notifications later, enable the Push Notifications capability in the Xcode project from day one. Retrofitting it requires re-signing and re-uploading every build.

---

## 7. What the iOS app will NOT have at MVP

Be explicit about this so scope stays honest:

- ❌ No widgets (post-MVP)
- ❌ No Live Activities
- ❌ No iPad-optimized layouts (universal build, but phone-first)
- ❌ No offline mode beyond the last-seen canvas
- ❌ No push notifications
- ❌ No in-app purchases / subscriptions
- ❌ No Share Sheet extension (you can share *from* the app, but can't receive shares *into* it)
- ❌ No Siri Shortcuts integration
- ❌ No Apple Watch companion
- ❌ No Sign in with Apple (not required as long as we only have email/password)

---

## 8. Recommended file layout for the iOS project

```
ios/
├── README.md                    ← this file
├── openapi.json                 ← exported from FastAPI /openapi.json
├── dastan/                      ← Expo app root
│   ├── app.json
│   ├── eas.json
│   ├── package.json
│   ├── app/                     ← expo-router routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx            ← Today
│   │   ├── (auth)/
│   │   │   ├── signin.tsx
│   │   │   └── signup.tsx
│   │   ├── gallery/
│   │   │   └── index.tsx
│   │   ├── artists/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── thinkers/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── faal/
│   │   │   └── index.tsx
│   │   ├── archive/
│   │   │   ├── index.tsx
│   │   │   └── [date].tsx
│   │   ├── favorites/
│   │   │   └── index.tsx
│   │   └── profile/
│   │       └── index.tsx
│   ├── components/              ← RN components mirroring web
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts          ← expo-secure-store adapter
│   │   ├── api.ts               ← re-exports from dastan-core
│   │   └── audio.ts             ← TTS + ambient controller
│   ├── assets/
│   │   ├── fonts/
│   │   │   ├── PlayfairDisplay-Bold.ttf
│   │   │   ├── SourceSerif4-Regular.ttf
│   │   │   └── NotoNaskhArabic-Regular.ttf
│   │   └── icons/
│   └── ios/                     ← auto-generated by expo prebuild
└── packages/
    └── dastan-core/             ← shared with web frontend
        ├── package.json
        ├── api.ts
        ├── types.ts
        ├── supabase.ts
        └── supabase-data.ts
```

---

## 9. Backend changes required

Good news: very few.

- **CORS**: add Expo dev origins in `backend/app/main.py`. (Already handles `mydastan.com`.)
- **OpenAPI export**: add a CI step that dumps `/openapi.json` to `ios/openapi.json` on every backend deploy, so the iOS client types stay in sync.
- **Rate limit `/api/canvas/today`**: add Redis caching by `(date, user_id)` with 6-hour TTL (see risk 6.6).
- **Cache headers on `/collection/*`**: ensure nginx sets `Cache-Control: public, max-age=2592000, immutable`. Check `deploy/nginx.conf`.
- **Audio content-type**: confirm `/api/tts/speak` returns a valid `Content-Length` header. `AVPlayer` streams better when it knows the total size.
- **JWKS caching**: backend already caches Supabase JWKS — confirm the cache TTL matches Supabase's rotation schedule (usually 24h).

No new endpoints required for MVP. Every feature in the web app already has the backend route it needs.

---

## 10. Cost model (recurring)

Per-user monthly cost stays exactly the same as the web app — Dastan's cost drivers are AI and TTS requests, not the client runtime. Adding iOS adds:

- **Apple Developer Program**: $99/year.
- **TestFlight**: free.
- **App Store**: 15% commission on IAP, 30% on first-year subs. Not relevant until you monetize.
- **Push notifications (APNs)**: free. Only costs your own server time to dispatch.
- **Sentry**: free tier covers early testing.
- **Cloudflare** (if you CDN the painting catalog): free tier covers Dastan's current traffic.

The only real new recurring cost is the Developer Program and whatever proportion of backend traffic iOS users add.

---

## 11. Open questions to resolve before writing iOS code

These are decisions someone has to make, not code to write:

1. **Shared code vs. two codebases?** If iOS ships and lives, do you extract a `dastan-core` package now, or defer? Extracting is cheap day 1, expensive day 100.
2. **Who is the iOS audience?** Persian-speaking users primarily? English-speaking art appreciators? The answer drives whether Faal is MVP or post-MVP.
3. **Daily push notification?** "Your canvas for today is ready" is the single most valuable engagement lever for a daily-content app. Worth scoping in early even if built late.
4. **Widgets?** An iOS home-screen widget showing today's painting is a huge unlock for this app specifically. Plan for it by keeping the Today API cheap and cacheable.
5. **What happens at midnight?** When does "today" tick over — user's local time, Tehran time, UTC? The web app uses server time. The iOS app should probably match. Document this.
6. **Free or paid?** If free, plan for Ads vs. donations vs. nothing. If paid, decide IAP vs. subscription model before you submit.
7. **Android later?** React Native / Expo supports Android for free. If Android matters at all, choose Option B. If not, Option C (SwiftUI) becomes more defensible.

---

## 12. First concrete task to start tomorrow

If you want to begin without ceremony, do exactly this, in order:

1. Export the backend's OpenAPI spec to `ios/openapi.json` (`curl https://www.mydastan.com/openapi.json -o ios/openapi.json`).
2. Run `npx create-expo-app dastan --template blank-typescript` inside `ios/`.
3. Install `@supabase/supabase-js` and `expo-secure-store`.
4. Copy `frontend/src/lib/supabase.ts` to `ios/dastan/lib/supabase.ts`, swap `localStorage` for a `SecureStore` adapter.
5. Build a single "Today" screen that calls `/api/canvas/today` and renders today's painting title. That's it.
6. Run it on the simulator. Watch the backend log. If you see a 200 response and a painting title on the simulator screen, the whole plan works and everything after step 6 is just more of the same.

From that minimum-viable smoke test to a TestFlight build with all features is roughly the sequence in Section 5.

---

## 13. Appendix: reference files in the existing codebase

Useful as starting points when porting each feature:

| Feature | Web source |
|---|---|
| Auth provider | `frontend/src/lib/auth.tsx` |
| Supabase client | `frontend/src/lib/supabase.ts` |
| Supabase data helpers | `frontend/src/lib/supabase-data.ts` |
| API client | `frontend/src/lib/api.ts` |
| Today page | `frontend/src/app/page.tsx` |
| Painting card | `frontend/src/components/canvas/PaintingCard.tsx` |
| Novel card | `frontend/src/components/canvas/NovelPageCard.tsx` |
| Literature card | `frontend/src/components/canvas/LiteratureCard.tsx` |
| Faal card (hardest) | `frontend/src/components/canvas/FaalCard.tsx` |
| Philosopher list | `frontend/src/app/philosophers/page.tsx` |
| Philosopher detail | `frontend/src/app/philosophers/[id]/page.tsx` |
| Philosopher illustrations | `frontend/src/app/philosophers/illustrations.tsx` |
| Artists list | `frontend/src/app/artists/page.tsx` |
| Gallery | `frontend/src/app/gallery/page.tsx` |
| Types | `frontend/src/lib/types.ts` |
| Backend canvas route | `backend/app/api/routes/canvas.py` |
| Backend TTS route | `backend/app/api/routes/tts.py` |
| Backend AI route | `backend/app/api/routes/ai.py` |
| Backend auth dependency | `backend/app/core/auth.py` |
| Postgres models | `backend/app/models/models.py` |

---

**Bottom line:** the hard parts are Faal audio, Supabase session persistence, and asset footprint. Everything else is a straightforward Expo + React Native build against an existing REST backend. Pick Option B, start with Section 12's six-step smoke test, and iterate.

image.png