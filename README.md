# DarshanEase — Temple Darshan Booking Platform

Full-stack pilgrim booking app. React + Vite frontend, Node.js + Express backend, PostgreSQL database.

---

## Project Structure

```
darshanease/
├── src/                    # React frontend (Vite)
│   ├── app/App.tsx         # Main application component
│   ├── lib/api.ts          # Typed API client
│   ├── styles/             # CSS design tokens, fonts, Tailwind
│   ├── main.tsx            # React entry point
│   └── vite-env.d.ts       # Vite env type declarations
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── index.ts        # Express server entry
│   │   ├── lib/db.ts       # PostgreSQL pool
│   │   ├── middleware/auth.ts
│   │   └── routes/         # auth, temples, bookings, family, donations
│   ├── schema.sql          # PostgreSQL schema + seed data
│   ├── package.json
│   └── tsconfig.json
├── public/                 # Static assets (favicon)
├── index.html              # HTML entry point
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Quick Start (Local Development)

### 1. Clone & install frontend

```bash
git clone https://github.com/yourusername/darshanease.git
cd darshanease
npm install          # or: pnpm install
```

### 2. Start the frontend (demo mode — no backend needed)

```bash
npm run dev
# → http://localhost:5173
```

The app works fully with mock data. Skip steps 3–5 if you just want to explore the UI.

### 3. Set up PostgreSQL

```bash
# macOS
brew install postgresql && brew services start postgresql
createdb darshanease

# Ubuntu / Debian
sudo apt install postgresql
sudo -u postgres createdb darshanease
```

### 4. Seed the database

```bash
psql darshanease -f backend/schema.sql
```

### 5. Start the backend

```bash
cd backend
cp .env.example .env
# Edit .env → set JWT_SECRET and DATABASE_URL

npm install
npm run dev
# → http://localhost:3001
```

### 6. Connect frontend to backend

Create `.env.local` in the project root:

```env
VITE_API_URL=http://localhost:3001/api
```

Restart `npm run dev`. The frontend now reads/writes real data.

---

## Deployment

### Option A — Vercel (frontend) + Render (backend) + Supabase (PostgreSQL)

**Supabase (database)**
1. Create project at supabase.com
2. Go to Settings → Database → Connection String → copy URI
3. Run schema: `psql "YOUR_SUPABASE_URI" -f backend/schema.sql`

**Render (backend)**
1. New Web Service → connect GitHub → root directory: `backend`
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Environment variables:
   ```
   DATABASE_URL=<supabase connection string>
   JWT_SECRET=<run: openssl rand -hex 32>
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

**Vercel (frontend)**
1. Import GitHub repo → Framework: Vite
2. Root: `.` (project root)
3. Build: `npm run build` → Output: `dist`
4. Environment variable:
   ```
   VITE_API_URL=https://your-render-app.onrender.com/api
   ```

### Option B — Railway (backend + PostgreSQL together)

1. New Project → Deploy from GitHub → root: `backend`
2. Add PostgreSQL plugin (DATABASE_URL auto-injected)
3. Set `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
4. Run schema via Railway shell: `psql $DATABASE_URL -f schema.sql`

---

## Design System

All styling uses CSS custom properties defined in `src/styles/theme.css`.
Update tokens there to restyle the entire app without touching components.

| Token | Purpose |
|---|---|
| `--primary` | Saffron accent, CTAs |
| `--background` | Page background |
| `--foreground` | Body text |
| `--card` | Card surfaces |
| `--muted` | Subtle backgrounds |
| `--border` | Borders and dividers |
| `--font-display` | Cinzel — headings |
| `--font-body` | Lora — body text |
| `--font-mono` | DM Mono — codes, OTP |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register with email + phone |
| POST | `/api/auth/login` | — | Login with email/password |
| POST | `/api/auth/otp/send` | — | Send OTP to phone |
| POST | `/api/auth/otp/verify` | — | Verify OTP, get token |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/temples` | — | List temples (filter: religion, state, search) |
| GET | `/api/temples/:id` | — | Temple detail |
| GET | `/api/temples/:id/poojas` | — | Pooja types for temple |
| GET | `/api/temples/:id/slots?date=` | — | Available time slots |
| GET | `/api/bookings` | ✓ | My bookings |
| POST | `/api/bookings` | ✓ | Create booking |
| PATCH | `/api/bookings/:id/cancel` | ✓ | Cancel booking |
| GET | `/api/family` | ✓ | Family members |
| POST | `/api/family` | ✓ | Add family member |
| DELETE | `/api/family/:id` | ✓ | Remove family member |
| GET | `/api/donations` | ✓ | My donations |
| POST | `/api/donations` | ✓ | Make donation |

---

## SMS OTP (Production)

In `backend/src/routes/auth.ts`, replace the console.log with your SMS provider:

```typescript
// Fast2SMS (India)
await fetch("https://www.fast2sms.com/dev/bulkV2", {
  method: "POST",
  headers: { authorization: process.env.FAST2SMS_KEY! },
  body: JSON.stringify({ route: "otp", numbers: phone, variables_values: code }),
});
```

Add `FAST2SMS_KEY` to your backend environment variables.
