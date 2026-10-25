# CampusNav GEC Palakkad

**Navigate Your Campus. Without Getting Lost.**

A full-stack campus navigation web application for Government Engineering College Sreekrishnapuram (GECSKP), Palakkad, Kerala, India.

CampusNav helps students, faculty, staff, and visitors find buildings, departments, classrooms, laboratories, and other campus facilities through an interactive navigation interface.

## Features

* **Interactive 2D Map** — Campus buildings, locations, markers, and walking routes.
* **3D Campus Mode** — Three-dimensional campus visualization with route animations.
* **Dijkstra Routing** — Shortest-path calculation between connected campus locations.
* **AI CampusNav Assistant** — Conversational assistance for campus navigation.
* **Authentication** — Email/password login and Google OAuth, when configured.
* **User Profiles** — User account and profile management.
* **Admin Dashboard** — Manage campus locations, buildings, paths, and reports.
* **Map Editor** — Add and update locations and walking connections.
* **Indoor Navigation** — Floor-based navigation using configured indoor map data.
* **GPS Location** — Browser geolocation support, subject to device permissions and GPS accuracy.
* **Emergency Navigation** — Access configured emergency exits and medical facilities.
* **Nearby Facilities** — Find facilities such as toilets, libraries, and canteens.
* **Dark and Light Themes** — Switch between appearance modes.
* **Responsive Design** — Interface designed for desktop, tablet, and mobile devices.

## Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Framework        | Next.js App Router                               |
| Language         | TypeScript                                       |
| UI               | React, Tailwind CSS                              |
| Database         | PostgreSQL / Supabase                            |
| ORM              | Prisma                                           |
| Authentication   | NextAuth and configured authentication providers |
| 2D Maps          | MapLibre GL JS and OpenStreetMap                 |
| 3D Visualization | Three.js and React Three Fiber                   |
| AI Integration   | Vercel AI SDK and OpenAI                         |
| State Management | Zustand                                          |
| Deployment       | Vercel and Supabase                              |

Some features require external services and environment variables to be configured before they can be used.

## Getting Started

### Prerequisites

Install the following software:

* Node.js 18 or a compatible version required by the project dependencies
* npm or Yarn
* Git
* A configured PostgreSQL database or Supabase project, if database functionality is required

### 1. Clone the Repository

```bash
git clone https://github.com/sreeragothayoth921-gif/GECPnavigation.git
cd GECPnavigation
```

### 2. Install Dependencies

If the project uses npm:

```bash
npm install
```

### 3. Configure Environment Variables

Create a local environment file by copying the example:

```bash
cp .env.example .env.local
```

On Windows PowerShell, you can alternatively run:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and configure the variables required by the project.

Common examples include:

* `DATABASE_URL` — Database connection string.
* `NEXTAUTH_SECRET` — Authentication secret, if required by the configured authentication system.
* `GOOGLE_CLIENT_ID` — Google OAuth client ID, if Google login is enabled.
* `GOOGLE_CLIENT_SECRET` — Google OAuth client secret, if Google login is enabled.
* `OPENAI_API_KEY` — OpenAI API key, if the AI assistant uses OpenAI.
* Supabase URL and public key variables required by the project.

Use the actual variable names documented in `.env.example`, `SUPABASE_SETUP.md`, and the source code.

**Security:** Never commit `.env`, `.env.local`, `.env.production`, API keys, passwords, or database credentials to GitHub.

### 4. Configure the Database

If the project uses Prisma, configure the database connection first.

Then run the commands supported by the project:

```bash
npx prisma generate
npx prisma db push
```

If a seed script is configured, run it using the command specified in `package.json`.

Review `SUPABASE_SETUP.md` before configuring Supabase.

### 5. Start the Development Server

```bash
npm run dev
```

Open the following address in your browser:

http://localhost:3000

Keep the terminal running while using the local application.

## Project Structure

```text
GECPnavigation/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── common/
│   │   ├── map/
│   │   ├── navigation/
│   │   └── three-d/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── database/
│   │   ├── maps/
│   │   └── routing/
│   ├── stores/
│   └── styles/
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── SUPABASE_SETUP.md
├── DEPLOYMENT.md
└── DIJKSTRA_EXPLANATION.md
```

The exact files and folders may change as the project develops.

## How Navigation Works

CampusNav represents the campus as a graph:

* **Nodes:** Buildings, entrances, rooms, junctions, and facilities.
* **Edges:** Walkable connections between locations.
* **Weights:** Distances or other configured routing costs.
* **Route calculation:** Dijkstra's algorithm calculates the lowest-cost route between connected nodes.

The calculated route can be displayed on the map when the necessary campus map data and connections are configured.

Indoor navigation requires suitable floor plans and indoor path data. GPS may be inaccurate inside buildings, so manual location selection can be used as an alternative.

## Dijkstra's Algorithm

The routing implementation uses Dijkstra's shortest-path algorithm to find the minimum-cost route through the campus graph.

For a binary-heap implementation, the typical time complexity is:

**O((V + E) log V)**

Where:

* `V` is the number of graph vertices.
* `E` is the number of graph edges.

Routing preferences, accessibility restrictions, stairs, and blocked paths depend on how they are configured in the application.

See `DIJKSTRA_EXPLANATION.md` for further details.

## Campus Data

Campus locations and paths are maintained using the project's data files and database.

The accuracy of the navigation system depends on the accuracy of the configured locations, coordinates, floor plans, and walking connections. Approximate or demonstration data should be verified before real-world use.

## Deployment

The application is intended to support deployment using Vercel and a configured database service such as Supabase.

General deployment steps:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the database and authentication providers.
4. Add the required environment variables in the deployment settings.
5. Build and deploy the application.
6. Test authentication, navigation, database operations, and protected admin routes.

See `DEPLOYMENT.md` and `SUPABASE_SETUP.md` for project-specific instructions.

## Security Notes

* Never commit environment files containing real secrets.
* Do not expose private API keys in client-side code.
* Protect administrative operations with server-side authorization.
* Do not rely on hiding admin pages as the only access-control mechanism.
* Configure database permissions and authentication redirects before deployment.
* Do not use demonstration credentials for a production deployment.

## Project Information

**Project:** CampusNav — Campus Navigation System
**Institution:** Government Engineering College Sreekrishnapuram
**Location:** Palakkad, Kerala, India
**Purpose:** B.Tech Mini Project

---

*Navigate Your Campus. Without Getting Lost.*
