# Habit Tracker

A high-performance, mobile-responsive habit tracking app built with React and Supabase. Track daily habits, visualize consistency with a GitHub-style heatmap, and build streaks.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-blue?logo=tailwindcss)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

## Features

- **Authentication** — Email/password signup and login via Supabase Auth
- **Today View** — Dashboard showing all habits with one-tap completion checkboxes
- **Full CRUD** — Create, edit, and delete habits with category and frequency settings
- **Contribution Heatmap** — 365-day GitHub-style activity grid
- **Streak Tracking** — Current streak and longest streak calculated per habit
- **Optimistic UI** — Instant feedback on all actions with automatic rollback on failure
- **Dark Mode** — Enabled by default with full theme support
- **PWA Ready** — Installable on mobile with offline service worker support
- **Row Level Security** — Users can only access their own data via Supabase RLS policies

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn/ui |
| Icons | Lucide React |
| Backend | Supabase (Auth + PostgreSQL) |
| Date Logic | date-fns |
| PWA | vite-plugin-pwa + Workbox |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and Install

```bash
git clone https://github.com/your-username/habit-tracker.git
cd habit-tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up the Database

**Option A — Supabase CLI (recommended):**

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

**Option B — Manual:**

Copy the contents of `supabase/migrations/20260309000000_create_habits_schema.sql` and run it in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── AuthPage.tsx       # Login / Signup
│   ├── Dashboard.tsx      # Main view with stats + habit list
│   ├── HabitCard.tsx      # Habit row with checkbox and actions
│   ├── HabitDialog.tsx    # Create / Edit modal
│   └── Heatmap.tsx        # GitHub-style contribution grid
├── context/
│   └── AuthContext.tsx    # Auth state provider
├── hooks/
│   └── useHabits.ts       # Habit + completion logic
├── lib/
│   ├── database.types.ts  # TypeScript types for DB schema
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Utility functions
├── App.tsx                # Auth guard
├── main.tsx               # Entry point
└── index.css              # Tailwind + theme config
```

## Database Schema

**`habits`** — Stores user-created habits

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| title | text | Habit name |
| frequency | int | Target times per week |
| category | text | Category label |
| created_at | timestamptz | Creation timestamp |

**`completions`** — Tracks daily habit completions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| habit_id | uuid | FK to habits |
| user_id | uuid | FK to auth.users |
| completed_at | date | Completion date |

Both tables have RLS enabled with policies restricting access to `auth.uid() = user_id`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## License

MIT
