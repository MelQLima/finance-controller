# Finance Controller MVP

Mobile-first personal finance web app for:
- expense tracking
- income tracking
- installment purchases
- recurring bills
- monthly forecasting
- calendar visualization
- future purchase planning

Built as a simple monolithic Next.js app with Supabase.

## Tech Stack

- Next.js 15 (App Router)
- React + TypeScript (strict mode)
- TailwindCSS
- Shadcn/ui-style reusable components
- Supabase (Auth, PostgreSQL, Realtime, Storage)
- Recharts
- React Hook Form + Zod
- Lucide icons
- PWA with `next-pwa`

## Architecture (Simple and Scalable)

- **Monolith only**: one Next.js app, no microservices
- **No infra extras**: no Docker, Kubernetes, Redis, queues
- **Folder separation by responsibility**:
  - routing and server actions in `app/`
  - UI primitives and feature components in `components/`
  - external clients/config in `lib/`
  - domain queries/composition in `services/`
  - typed entities and schemas in `types/`
  - focused helpers in `utils/`

## Features Implemented

### Authentication
- Login
- Signup
- Protected routes via middleware
- Session persistence with Supabase SSR helpers

### Dashboard
- Current month balance
- Income vs expense summary cards
- Recent transactions
- Expense pie chart
- Monthly evolution line chart

### Transactions
- Create transaction
- Edit transaction
- Delete transaction
- List transactions
- Filters by month, category, account, type, status

### Installments
- Automatic future statement creation
- Installment grouping metadata (`installment_group_id`, number, total)

### Recurring Items
- Create recurring income/bills
- Auto-generation of future scheduled statements

### Calendar
- Monthly view
- Scheduled and due transactions by day

### Wishlist
- Create item with price, priority, desired date
- Recommended purchase month based on forecast balance

### Settings
- Profile summary
- Avatar upload to Supabase Storage

## Routes

- `/login`
- `/signup`
- `/dashboard`
- `/transactions`
- `/calendar`
- `/forecast`
- `/wishlist`
- `/settings`

## Project Structure

```txt
app/
  (protected)/
    calendar/
    dashboard/
    forecast/
    settings/
    transactions/
    wishlist/
  actions/
  login/
  signup/
components/
  charts/
  dashboard/
  forms/
  layout/
  providers/
  transactions/
  ui/
hooks/
lib/
  actions/
  supabase/
services/
supabase/
types/
utils/
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Requirements

- Node.js `>= 18.18.0` (recommended: Node 20+)
- npm `>= 9` recommended

## Local Development

```bash
npm install
npm run dev
```

App runs at:
- [http://localhost:3000](http://localhost:3000)

## Production Build

```bash
npm run build
npm run start
```

## Supabase Setup Notes

The app expects these existing tables:
- `profiles`
- `accounts`
- `categories`
- `statements`
- `recurring_items`
- `monthly_forecasts`
- `shopping_wishlist`

Typed interfaces for these entities are in `types/database.ts`.

### RLS Compatibility

- Queries are scoped by `user_id` where applicable.
- Authenticated user session is resolved server-side.
- Private pages are protected in middleware.

## Seed Data

Example SQL is available at `supabase/seed.sql`.

Before running it:
1. replace `<USER_ID>` with a real authenticated user id
2. ensure your schema matches expected columns

## Realtime

- Realtime refresh hook: `hooks/use-statements-realtime.ts`
- Connected in protected layout via `components/transactions/realtime-sync.tsx`
- Listens to `postgres_changes` for `statements` and refreshes route data

## PWA

- Manifest: `public/manifest.webmanifest`
- Next config: `next.config.ts` with `next-pwa`
- In development mode, service worker is intentionally disabled

## Security Notes

- Use only `anon` key in frontend/browser contexts
- Never expose `service_role` in client-side code
- cURL examples below intentionally use `anon` + user JWT only

---

## cURL Quickstart

### 1) Shared Shell Variables

```bash
export SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
export SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
export APP_URL="http://localhost:3000"
```

### 2) App Runtime Smoke Checks

Check app root redirect behavior:

```bash
curl -i "$APP_URL/"
```

Check public auth pages:

```bash
curl -i "$APP_URL/login"
curl -i "$APP_URL/signup"
```

Check protected page without auth cookie (should redirect):

```bash
curl -i "$APP_URL/dashboard"
```

---

## Supabase Auth cURLs

### 1) Sign Up (Email + Password)

```bash
curl -sS -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "StrongPassword123!"
  }'
```

### 2) Sign In (Get Access Token)

```bash
curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "StrongPassword123!"
  }'
```

Save access token:

```bash
export ACCESS_TOKEN="PASTE_ACCESS_TOKEN_HERE"
```

### 3) Get Current User

```bash
curl -sS "$SUPABASE_URL/auth/v1/user" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Supabase Database cURLs (RLS-Friendly)

All examples below use:
- `apikey: anon key`
- `Authorization: Bearer user access token`

### 1) List Accounts

```bash
curl -sS "$SUPABASE_URL/rest/v1/accounts?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 2) Create Category

```bash
curl -sS -X POST "$SUPABASE_URL/rest/v1/categories" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "user_id": "USER_UUID",
      "name": "Streaming",
      "color": "#8b5cf6",
      "type": "expense"
    }
  ]'
```

### 3) Create Transaction (Statement)

```bash
curl -sS -X POST "$SUPABASE_URL/rest/v1/statements" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "user_id": "USER_UUID",
      "account_id": "ACCOUNT_UUID",
      "category_id": "CATEGORY_UUID",
      "description": "Groceries",
      "amount": 125.90,
      "type": "expense",
      "status": "paid",
      "statement_date": "2026-05-08",
      "due_date": "2026-05-08"
    }
  ]'
```

### 4) Filter Transactions by Month

```bash
curl -sS "$SUPABASE_URL/rest/v1/statements?select=*&statement_date=gte.2026-05-01&statement_date=lte.2026-05-31&order=statement_date.desc" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 5) Update Transaction Status

```bash
curl -sS -X PATCH "$SUPABASE_URL/rest/v1/statements?id=eq.STATEMENT_UUID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "paid"
  }'
```

### 6) Delete Transaction

```bash
curl -sS -X DELETE "$SUPABASE_URL/rest/v1/statements?id=eq.STATEMENT_UUID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 7) Create Recurring Item

```bash
curl -sS -X POST "$SUPABASE_URL/rest/v1/recurring_items" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "user_id": "USER_UUID",
      "account_id": "ACCOUNT_UUID",
      "category_id": "CATEGORY_UUID",
      "description": "Gym Membership",
      "amount": 49.90,
      "type": "expense",
      "day_of_month": 5,
      "starts_at": "2026-05-01",
      "active": true
    }
  ]'
```

### 8) Create Forecast Row

```bash
curl -sS -X POST "$SUPABASE_URL/rest/v1/monthly_forecasts" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "user_id": "USER_UUID",
      "month": "2026-06",
      "projected_income": 5000,
      "projected_expense": 3400,
      "projected_balance": 1600
    }
  ]'
```

### 9) Create Wishlist Item

```bash
curl -sS -X POST "$SUPABASE_URL/rest/v1/shopping_wishlist" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "user_id": "USER_UUID",
      "title": "New Laptop",
      "estimated_price": 1800,
      "priority": "high",
      "desired_date": "2026-11-01"
    }
  ]'
```

---

## Supabase Storage cURLs (Safe Pattern)

Upload user avatar to `avatars` bucket with user JWT:

```bash
curl -sS -X POST "$SUPABASE_URL/storage/v1/object/avatars/USER_UUID/avatar.png" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: image/png" \
  --data-binary "@./avatar.png"
```

Get public URL (if bucket/object policy allows public read):

```bash
echo "$SUPABASE_URL/storage/v1/object/public/avatars/USER_UUID/avatar.png"
```

---

## Troubleshooting

### Node version error
If you see a Node compatibility message, upgrade Node:
- required by this project: `>= 18.18.0`
- recommended: Node 20+

### Auth works but DB returns empty
- verify your RLS policies
- verify `user_id` in inserted rows matches authenticated user id

### Protected routes keep redirecting to login
- confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- clear browser cookies and login again

## License

For personal/educational use in MVP stage. Add a project license file if you plan to publish.
