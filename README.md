# Habit Tracker

A high-performance, mobile-responsive habit tracking app built with React and Supabase. Track daily habits, visualize consistency with a GitHub-style heatmap, build streaks, and stay focused with a Streaks-inspired experience.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-blue?logo=tailwindcss)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

## Features

### Core
- **Authentication** — Email/password signup and login via Supabase Auth with required display name
- **Today View** — Dashboard showing all habits in a 2-column slot grid with animated streak rings
- **Full CRUD** — Create, edit, and delete habits with category, frequency, and scheduling settings
- **Contribution Heatmap** — 365-day GitHub-style activity grid
- **Streak Tracking** — Current streak and longest streak calculated per habit
- **Optimistic UI** — Instant feedback on all actions with automatic rollback on failure
- **Dark Mode** — Enabled by default with full theme support
- **PWA Ready** — Installable on mobile with offline service worker support
- **Row Level Security** — Users can only access their own data via Supabase RLS policies

### Custom Day-of-Week Scheduling
Pick specific days for each habit (e.g., Mon/Wed/Fri) instead of just "X times per week." Non-scheduled days are skipped in streak calculations — they won't break your streak.

### Negative Habits (Avoid)
Support "avoid" habits (e.g., "Don't smoke", "No junk food") where NOT doing something counts as success. If you slip, tap the ring to mark a failure. The card shows a shield icon — green when avoided, red when failed.

### Task Limit with Visual Slots
A maximum of 12 active habits keeps you focused. The dashboard displays a grid of filled and empty slots. Empty slots are clickable placeholders that open the new habit dialog.

### Streak Freeze / Rest Days
Life happens. Streak freezes let you protect your streak on days you can't complete a habit, without losing your progress.

- Each habit gets **2 freezes per calendar month**
- Tap the snowflake icon on a habit card to freeze today's streak for that habit
- Frozen days are treated as completed in streak calculations — your streak continues unbroken
- The freeze button only appears when the habit is not yet completed, not already frozen, and you have freezes remaining
- A snowflake badge appears on the card when today is frozen
- Frozen days are highlighted with a blue border on the habit card
- Freeze count resets at the start of each month

### Visual Streak Ring Animation
Each habit displays an animated SVG ring showing daily progress:
- **Green** — on track (completed today or frozen)
- **Yellow** — at risk (streak active but not yet completed today)
- **Red** — broken (no active streak)

Tap the ring to toggle completion. For multi-daily habits, each tap increments progress; tapping when full resets to zero.

### Reset Completions
A reset button (circular arrow icon) appears on each habit card when there are completions for today. Tap it to clear all of today's completions for that habit.

### Enhanced Stats & Analytics
A dedicated stats page accessible from the header with:
- **Completion Rate** — Weekly or monthly line chart showing completion percentage over time
- **Day-of-Week Performance** — Bar chart revealing which days you're strongest
- **Monthly Calendar** — Color-coded calendar view with navigable months
- **Best Streaks** — Ranked list of your top streaks across all habits
- **Summary Cards** — Total completions, average per day, and active habit count

### Reminders & Notifications
Set per-habit reminder times in the habit editor. The app checks every minute and sends browser notifications for incomplete habits when their reminder time arrives. Requires notification permission.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn/ui |
| Icons | Lucide React |
| Charts | Recharts |
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

Run each migration file in `supabase/migrations/` in order using the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── AuthPage.tsx           # Login / Signup
│   ├── Dashboard.tsx          # Main view with stats, heatmap, habit grid
│   ├── DisplayNamePrompt.tsx  # First-time display name setup
│   ├── HabitCard.tsx          # Habit card with streak ring and actions
│   ├── HabitDialog.tsx        # Create / Edit modal (type, schedule, reminder)
│   ├── Heatmap.tsx            # GitHub-style contribution grid
│   ├── StatsPage.tsx          # Analytics with charts and calendar
│   └── StreakRing.tsx          # Animated SVG progress ring
├── context/
│   └── AuthContext.tsx        # Auth state provider
├── hooks/
│   └── useHabits.ts           # Habit, completion, and freeze logic
├── lib/
│   ├── database.types.ts      # TypeScript types for DB schema
│   ├── notifications.ts       # Browser notification helpers
│   ├── supabase.ts            # Supabase client
│   └── utils.ts               # Utility functions
├── App.tsx                    # Auth guard + view navigation
├── main.tsx                   # Entry point
└── index.css                  # Tailwind + theme config
```

## Database Schema

**`habits`** — Stores user-created habits

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| title | text | Habit name |
| frequency | int | Target completions per period |
| frequency_period | text | Period: day, week, month, year |
| category | text | Category label |
| scheduled_days | integer[] | Days of week (0=Sun–6=Sat), null = every day |
| habit_type | text | 'build' or 'avoid' |
| reminder_time | time | Optional reminder time (HH:MM) |
| created_at | timestamptz | Creation timestamp |

**`completions`** — Tracks daily habit completions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| habit_id | uuid | FK to habits |
| user_id | uuid | FK to auth.users |
| completed_at | date | Completion date |

**`streak_freezes`** — Tracks streak freeze usage

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| habit_id | uuid | FK to habits |
| used_at | date | Date the freeze was applied |
| created_at | timestamptz | Creation timestamp |

All tables have RLS enabled with policies restricting access to `auth.uid() = user_id`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run type-check` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

## License

MIT
