# CampusNav GEC Palakkad

**Navigate Your Campus. Without Getting Lost.**

A production-grade, full-stack campus navigation web application for Government Engineering College Sreekrishnapuram (GECSKP), Palakkad, Kerala, India.

## Features

- **Interactive 2D Map** - MapLibre GL JS with building polygons, floor overlays, custom markers
- **3D Campus Mode** - React Three Fiber visualization with animated routes
- **Dijkstra Routing** - Client + server shortest-path with preference filtering
- **AI CampusNav Agent** - Friendly chatbot with 6 function tools
- **Authentication** - Email/Password + Google OAuth for users, admin login
- **Admin Dashboard** - CRUD management, visual map editor, analytics
- **Responsive Design** - Works on desktop, laptop, tablet, mobile
- **Dark/Light Mode** - Theme toggle with persistence
- **Emergency Navigation** - Quick access to nearest exits and medical

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Auth | NextAuth + Supabase Auth |
| Maps 2D | MapLibre GL JS + OpenStreetMap |
| Maps 3D | React Three Fiber + Three.js |
| AI | Vercel AI SDK + OpenAI |
| Styling | Tailwind CSS + shadcn/ui patterns |
| State | Zustand + TanStack Query |
| Deployment | Vercel + Supabase |

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or Supabase)

### 1. Clone & Install
```bash
git clone <repo-url>
cd campusnav
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```
Fill in the required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for auth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `OPENAI_API_KEY` - OpenAI API key (for AI assistant)

### 3. Database Setup
```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gec.ac.in | Admin@GEC2024! |
| User | user@gec.ac.in | User@GEC2024! |

## Project Structure

```
campusnav/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Libraries (routing, AI, maps, auth)
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state stores
│   └── styles/           # Global styles
├── prisma/               # Database schema & migrations
├── data/                 # Campus data JSON files
├── public/               # Static assets
└── database/             # SQL schemas
```

## Dijkstra's Algorithm

The routing engine implements Dijkstra's shortest-path algorithm:

- **Time Complexity**: O((V + E) log V) with binary heap
- **Graph**: Campus locations as nodes, walkable paths as edges
- **Weights**: Distance in meters with preference-based penalties
- **Features**: Stairs penalty (1.3x), construction penalty (1.5x), wheelchair filtering

See `DIJKSTRA_EXPLANATION.md` for detailed explanation.

## Deployment

### Vercel + Supabase

1. Push to GitHub
2. Import project in Vercel
3. Connect Supabase database
4. Set environment variables
5. Deploy

See `DEPLOYMENT.md` for detailed instructions.

## License

B.Tech Mini Project - Government Engineering College Sreekrishnapuram