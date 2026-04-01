# Sorai — Your Personal Anime Tracker

A modern, full-stack web application to explore, search, and organize your personal anime list. Built with Next.js 14, Supabase, and the Jikan API.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_DB-3FCF8E?logo=supabase&logoColor=white)

---

## Features

### Browse & Discover
- **Hero Carousel** — Rotating spotlight of featured anime on the home page
- **Browse Categories** — Popular, Seasonal, Upcoming, Top Airing, Movies, OVAs, ONAs, Specials
- **Season Archives** — Browse anime by season and year (Winter, Spring, Summer, Fall)
- **Genre Filtering** — Action, Romance, Shounen, Sci-Fi, Fantasy, and more
- **Search** — Full-text search with pagination (12 results per page) and estimated total count

### Anime Detail
- Full synopsis, trailer, characters with voice actors, and episode list
- **Related Anime** and **Similar Anime** carousels with skeleton loading states
- Add to list, change status, rate with score (1–10)

### Personal Anime List
- **Grid view** and **List view** with status-based title hover colors
- Filter and search within your list
- Status management: Watching, Completed, On Hold, Dropped, Plan to Watch
- Score rating with interactive dropdowns

### User Settings
- Profile management: avatar upload/remove, username and email update
- Password change
- Sensitive content toggle (integrates with Jikan API `sfw` parameter)
- Data export (JSON) of your full anime list
- Account deactivation

### Performance & Reliability
- **API Caching** — `sessionStorage` caching layer with 10-minute TTL to reduce 429 rate limit errors
- **Deduplication** — Overfetch + dedup logic ensures exactly 12 unique cards per page
- **Suspense Boundaries** — Proper wrapping for `useSearchParams()` to pass Next.js build requirements
- **Progressive Loading** — Skeleton states for carousels and card grids

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 14](https://nextjs.org/) (App Router) | React framework with hybrid rendering |
| [TypeScript](https://www.typescriptlang.org/) | Static type checking |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first styling with CSS custom properties |
| [Supabase](https://supabase.com/) | PostgreSQL database + Authentication + Storage |
| [Jikan API v4](https://jikan.moe/) | Anime data from MyAnimeList — no API key required |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Sonner](https://sonner.emilkowal.dev/) | Toast notifications |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts + AuthProvider + Toaster)
│   ├── page.tsx                # Home — Hero carousel + Popular + Seasonal
│   ├── globals.css             # CSS custom properties + Tailwind config
│   ├── browse/page.tsx         # Browse by category, genre, or season archive
│   ├── search/page.tsx         # Search with pagination & estimated results
│   ├── anime/[id]/page.tsx     # Anime detail (synopsis, trailer, characters, etc.)
│   ├── my-list/page.tsx        # Personal anime list (private route)
│   └── settings/page.tsx       # User settings & account management
├── components/
│   ├── Navbar.tsx              # Navigation bar with browse categories
│   ├── Footer.tsx              # Site footer with quick links
│   ├── HeroCarousel.tsx        # Animated hero banner on home page
│   ├── AnimeCard.tsx           # Reusable anime card component
│   ├── AnimeCardSkeleton.tsx   # Skeleton loading placeholder
│   ├── AnimeHorizontalCarousel.tsx  # Horizontal scrollable carousel
│   ├── AuthModal.tsx           # Login / Register modal
│   └── DeleteConfirmModal.tsx  # Deletion confirmation dialog
├── context/
│   └── AuthContext.tsx         # Global authentication provider
├── lib/
│   ├── supabase.ts             # Supabase client initialization
│   ├── jikan.ts                # Jikan API wrapper with sessionStorage cache
│   ├── user-anime-list.ts      # CRUD operations for user anime list
│   └── user-profile.ts         # User profile management
└── types/
    └── anime.ts                # TypeScript type definitions
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** (included with Node.js)
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/erickdc7/sorai-app.git
cd sorai-app
npm install
```

### 2. Set up Supabase

#### 2.1 Create a project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project (or use an existing one)
3. Wait for initialization to complete

#### 2.2 Run the database schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Execute the query — this creates the required tables with RLS policies

#### 2.3 Disable email confirmation (Important)

> **⚠️ Without this step, registration won't work as expected.** Users will be created but won't be able to sign in until they confirm their email.

1. In Supabase, go to **Authentication** → **Providers** → **Email**
2. **Disable** the **"Confirm email"** option
3. Save changes

This allows users to register and sign in immediately without email verification.

#### 2.4 Get your API credentials

1. Go to **Settings** → **API** in your Supabase project
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...your_key_here
```

### 4. Run in development

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

### 5. Production build (optional)

```bash
npm run build
npm start
```

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Home — Hero carousel, popular anime, current season |
| `/browse?type=popular` | Public | Most popular anime of all time |
| `/browse?type=season` | Public | Currently airing anime |
| `/browse?type=upcoming` | Public | Upcoming anime |
| `/browse?type=airing` | Public | Top airing anime |
| `/browse?type=movies` | Public | Top rated anime movies |
| `/browse?type=ova` | Public | Original Video Animations |
| `/browse?type=ona` | Public | Original Net Animations |
| `/browse?type=special` | Public | Special episodes |
| `/browse?type=season-archive&year=2026&season=winter` | Public | Season archive |
| `/browse?genre=1` | Public | Browse by genre |
| `/search?q=term` | Public | Full-text search with pagination |
| `/anime/[id]` | Public | Anime detail page |
| `/my-list` | Private | User's personal anime list |
| `/settings` | Private | Account settings & preferences |

---

## Authentication

- **Register** with email, password, and username
- **Sign in** with email and password
- Private routes (`/my-list`, `/settings`) redirect to home if no session exists
- User avatar displays the initial of the username
- Account deactivation prevents sign-in and immediately signs out

---

## External APIs

### Jikan API v4

| | |
|---|---|
| **Base URL** | `https://api.jikan.moe/v4` |
| **Authentication** | None (free public API) |
| **Rate Limit** | 3 req/s — handled with caching + retry UI |

**Endpoints used:**

| Endpoint | Purpose |
|---|---|
| `/top/anime` | Popular and top airing anime |
| `/seasons/now` | Current season anime |
| `/seasons/upcoming` | Upcoming anime |
| `/seasons/{year}/{season}` | Season archives |
| `/anime?q=` | Full-text search |
| `/anime/{id}/full` | Complete anime details |
| `/anime/{id}/characters` | Character list with voice actors |
| `/anime/{id}/episodes` | Episode listing |
| `/anime/{id}/relations` | Related anime |
| `/anime/{id}/recommendations` | Similar anime recommendations |
| `/anime?genres={id}` | Browse by genre |

---

## Database

### `user_anime_list`

Stores the user's personal anime tracking data.

```sql
user_anime_list
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── mal_id (INTEGER)
├── status (TEXT: watching | completed | paused | dropped | planned)
├── score (INTEGER, 1–10, nullable)
├── anime_title (TEXT)
├── anime_image_url (TEXT)
├── anime_year (INTEGER)
├── anime_type (TEXT)
└── created_at (TIMESTAMP)
```

### `user_profiles`

Stores user profile data and preferences.

```sql
user_profiles
├── id (UUID, PK, FK → auth.users)
├── username (TEXT)
├── avatar_url (TEXT, nullable)
├── show_sensitive_content (BOOLEAN, default false)
├── deactivated_at (TIMESTAMP, nullable)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

Row Level Security (RLS) ensures each user can only read and modify their own data.

---

## Design System

All colors are defined as CSS custom properties in `globals.css` for consistency and easy theming:

- **Primary palette** — Purple theme (`--color-primary`, `--color-primary-light`, etc.)
- **Status colors** — Watching (green), Completed (purple), On Hold (yellow), Dropped (red), Plan to Watch (blue)
- **Browse categories** — Each category has its own icon and background color token
- **Season icons** — Winter (❄️ sky), Spring (🌸 pink), Summer (☀️ amber), Fall (🍂 orange)
- **Typography** — Nunito Sans (body), Bebas Neue (headings), Marck Script (logo)

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Invalid supabaseUrl" | Check that `.env.local` has valid URLs (`https://...`) |
| Can't sign in after registering | Disable "Confirm email" in Supabase Authentication → Email |
| Images not loading | Check internet connection (images come from `cdn.myanimelist.net`) |
| 429 API error | Wait a few seconds and retry — Jikan has rate limiting. Cached data loads instantly. |
| Port 3000 in use | Next.js will automatically use 3001 |
| Build error with `useSearchParams` | Ensure Navbar is wrapped in a `<Suspense>` boundary |
| Font override warning | `adjustFontFallback: false` is set for Nunito Sans |

---

## License

This project is for personal and educational use. Anime data is provided by the [Jikan API](https://jikan.moe/) (unofficial MyAnimeList API).
