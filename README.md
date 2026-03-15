# AutoTrack Pro 🚗

A production-grade React Native (Expo) app for car distribution yard inspectors. Runs on **iOS, Android, and Web**. Built with Supabase, NativeWind, and full offline-first sync.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Native + Expo SDK 51 |
| Navigation | Expo Router v3 (file-based, nested tabs) |
| Language | TypeScript (strict) |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Backend | Supabase (PostgreSQL + REST API) |
| State | Zustand |
| Offline Storage | AsyncStorage |
| Network Detection | `@react-native-community/netinfo` |

---

## Setup Instructions

### 1. Prerequisites

```bash
node --version   # >= 18
brew install watchman   # Required on macOS to avoid EMFILE errors
npm install -g expo-cli
```

### 2. Clone & Install

```bash
git clone https://github.com/your-org/car-distribution-app.git
cd car-distribution-app
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

`.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Supabase Database Setup

Run the schema in **Supabase Dashboard → SQL Editor → New Query**:

```bash
# Copy and paste the contents of:
supabase/schema.sql
```

This creates the `vehicles` table with all unique constraints and indexes.

### 5. Seed 500 Vehicles

```bash
npm run seed
# or: node scripts/seed.js
```

### 6. Run the App

```bash
# All platforms (opens QR code)
npx expo start

# Specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

---

## Unique Field Constraints

The following fields have `UNIQUE` constraints enforced **at the database level**:

| Field | Why unique |
|-------|-----------|
| `vin` | A VIN is globally unique to one physical vehicle |
| `idempotency_key` | Ensures exactly-once delivery on offline sync retry |
| `lot_number` | One vehicle per yard lot slot at a time |

The **New Arrival form** also performs **client-side pre-flight checks** (online only):
- Before submitting, it queries Supabase for existing `vin` and `lot_number` matches
- Shows a field-level error immediately if a duplicate is found
- This prevents wasted round-trips and gives the inspector instant feedback

---

## Offline Sync & Idempotency

### How offline sync works

1. Inspector fills in the New Arrival form with no internet connection.
2. On submit, a **UUID v4 idempotency key** is generated client-side.
3. The form payload + key are written to `AsyncStorage` as a `SyncQueueItem` (status: `pending`).
4. The vehicle is **optimistically added** to the local Zustand store so it appears immediately in the fleet list (marked "Pending Sync").
5. `useNetworkMonitor` (backed by `NetInfo`) continuously watches connectivity.
6. When the device reconnects, the hook automatically calls `syncQueue_process()`.

### Idempotency — no duplicate records ever

The risk: the network can fail *after* Supabase creates the row but *before* the app receives the `201` response. A naive retry would insert a duplicate.

**Our solution uses two layers:**

**Layer 1 — Supabase upsert with `onConflict: 'idempotency_key'`**

```ts
await supabase
  .from('vehicles')
  .upsert(payload, { onConflict: 'idempotency_key', ignoreDuplicates: false })
```

If the key already exists, Supabase updates the row instead of throwing a unique constraint error. The app receives the existing record — no duplicate created.

**Layer 2 — Queue deduplication**

```ts
const alreadyQueued = queue.some((q) => q.idempotency_key === idempotency_key);
if (!alreadyQueued) queue.push(item);
```

A double-tap or race condition cannot enqueue the same key twice.

**Result:** the combination of DB-level upsert + queue deduplication guarantees **exactly-once delivery** regardless of how many times sync is retried.

### Retry behavior

- Items are retried automatically on every reconnect event.
- After `MAX_RETRY_COUNT` (3) failures, the item is marked exhausted.
- The Sync Queue tab shows all pending/failed items and their idempotency keys.
- Inspectors can manually clear failed records after investigation.

---

## Global Error Handling

Every screen is individually wrapped in a React class `ErrorBoundary`:

```tsx
export default function FleetScreen() {
  return (
    <ErrorBoundary screenName="Fleet">
      <FleetScreenInner />
    </ErrorBoundary>
  );
}
```

- `getDerivedStateFromError` catches the throw and sets `hasError: true`
- `componentDidCatch` logs to console (forwards to Sentry in production)
- A recovery UI renders with a "Try Again" button
- **The app does not crash** — only the failing screen shows the error UI; tabs and other screens continue working normally
- The root `_layout.tsx` has an additional top-level boundary as final safety net

---

## Incident Response — Rolling Back with EAS

### When to use this runbook

A critical bug has been found in the production build (crash, data loss, sync failure, etc.).

### Step 1 — Identify the last good build

```bash
eas build:list --platform all --limit 10
# Note the buildId of the last known-good build
```

### Step 2 — Resubmit the previous build

**iOS:**
```bash
eas submit --platform ios --id <good-build-id>
```
Then in App Store Connect → slow down or pause the bad version's phased release → promote the resubmitted build.

**Android:**
```bash
eas submit --platform android --id <good-build-id>
```
In Play Console → Production → Create new release → upload the good AAB → roll out to 100%.

### Step 3 — OTA rollback (JS-only bugs)

If the bug is **JavaScript-only** (no native module changes), use EAS Update for an instant fix:

```bash
git checkout <last-good-tag>
eas update --channel production --message "hotfix: rollback to v1.x.y"
```

This pushes a new JS bundle over-the-air. Users receive it on the next app launch — **no App Store approval required**.

### Step 4 — Communicate & post-mortem

1. Post in Slack `#incidents` with timeline and impact scope
2. Update status page
3. Write post-mortem within 24h: timeline, root cause, fix, prevention

### Prevention checklist

- [ ] All releases go through `preview` channel before `production`
- [ ] Sentry error monitoring + source maps uploaded on every build
- [ ] Separate `EXPO_PUBLIC_SUPABASE_URL` per environment (dev / staging / prod)
- [ ] Branch protection on `main`: 1 review + passing CI required
- [ ] Database schema changes run through Supabase migrations, not raw SQL

---

## Project Structure

```
car-distribution-app/
├── app/
│   ├── _layout.tsx              ← Root: ErrorBoundary + OfflineBanner + Stack nav
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tab bar with sync badge
│   │   ├── index.tsx            ← Fleet list (500+ vehicles, 60 FPS)
│   │   ├── new-arrival.tsx      ← New arrival form + VIN/lot duplicate checks
│   │   └── sync.tsx             ← Sync queue management
│   └── vehicle/[id].tsx         ← Vehicle detail
├── components/
│   ├── ErrorBoundary.tsx        ← Class-based boundary (prevents full app crash)
│   ├── FormFields.tsx           ← TextField + SelectField (NativeWind)
│   ├── OfflineBanner.tsx        ← Animated connectivity indicator
│   ├── StatusBadge.tsx          ← Color-coded status pill
│   └── VehicleCard.tsx          ← Memoized list card
├── constants/index.ts
├── hooks/useNetworkMonitor.ts   ← NetInfo → auto-sync on reconnect
├── lib/supabase.ts              ← Supabase client singleton
├── scripts/seed.js              ← Seeds 500 vehicles via Supabase REST
├── services/
│   ├── api.ts                   ← Supabase queries (upsert with idempotency)
│   └── syncQueue.ts             ← AsyncStorage offline queue
├── store/vehicleStore.ts        ← Zustand global state
├── supabase/schema.sql          ← DB schema with unique constraints
├── types/index.ts
├── .env                         ← Real credentials (git-ignored)
├── .env.example                 ← Template (committed)
├── global.css                   ← NativeWind entry point
├── metro.config.js              ← Metro + NativeWind
├── tailwind.config.js           ← Tailwind theme
└── tsconfig.json
```
