# Vestige — Make the Invisible Visible

> An Awwwards-grade, fully-immersive web app that reveals hidden financial leaks, lost time, unseen human effort and silent health debt.

---

## ✦ Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| State | Zustand v5 (persisted to localStorage) |
| Animations | GSAP 3 + ScrollTrigger |
| 3D / Canvas | Canvas 2D API (globe, shatter, holographic body) |
| AI routing | Vercel AI SDK + OpenAI (`gpt-4o-mini`) |
| Charts | Recharts |
| Styling | TailwindCSS |
| CSV parsing | PapaParse |

---

## ✦ Pages

| Route | Chapter | Accent |
|---|---|---|
| `/` | AI Gatekeeper landing | Cyan |
| `/economy` | The Phantom Economy (financial leaks) | Cyan |
| `/time` | Cognitive Load (time leaks) | Purple |
| `/effort` | The Unseen Human Effort (supply chains) | Orange |
| `/health` | **The Silent Health Debt** (new) | Bioluminescent Green |
| `/convergence` | The Convergence (past vs present) | Cyan |
| `/oracle` | The Oracle (5-year AI roadmap) | Purple |

---

## ✦ Quick Start

```bash
# 1. Install dependencies
npm install          # or pnpm install / yarn

# 2. Add your OpenAI key (optional — the app runs fully offline without one)
cp .env.example .env.local
# Edit .env.local → OPENAI_API_KEY=sk-...

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## ✦ The Health Module — `GET /health`

### What it does
Renders a **3D holographic human wireframe** (Canvas 2D) that reacts live to the user's daily habits:

| Bad habit → | WebGL effect |
|---|---|
| Short sleep, dehydration | Red particle storm, structural distortion |
| Excessive sitting | Compressed spine visualisation, orange highlight |
| Breath apnea | Low-level continuous static |

| Good habit → | Effect |
|---|---|
| 8 h sleep, hydration, movement | Bioluminescent cyan/green glow, calm particles |

### Input modes
1. **Quick habit presets** — one-click buttons (e.g. "Sat 9+ hours", "Drank 8 glasses")
2. **Sliders** — granular control of each factor
3. **Free text** — "sat for 9 hours, drank only 1 glass of water" → parsed offline via `lib/health-model.ts`

### Health Score (0–100)
Stored globally in Zustand and carried forward to:
- **The Convergence** — past-vs-present chart includes Health Score axis
- **The Oracle** — generates body-specific 5-year cards (sleep optimisation, posture, hydration, breath)

### AI Routing
The landing Gatekeeper now routes to `/health` for inputs like:
- _"I barely slept today"_, _"my back hurts from working"_, _"only drank 1 glass of water"_, _"sat at my desk all day"_

---

## ✦ State Architecture

```
Zustand (persisted)
  ├── economy   { txns, leaks, summary }         → Economy
  ├── time      { profile, result }               → Time
  ├── effort    { explored[], workers, humanHours } → Effort
  ├── health    { profile, result, score, history } → Health ← NEW
  ├── journal   JournalEntry[]                    → Gatekeeper
  ├── oracle    { cards, source, fingerprint }    → Oracle
  └── visited   ChapterId[]                      → ChapterNav
```

---

## ✦ AI Fail-safes

- **Gatekeeper**: If the OpenAI API is unavailable, a deterministic intent engine (`lib/intent.ts`) classifies the input using weighted keyword rules — zero latency, no network.
- **Oracle**: If generation fails, `lib/oracle.ts#fallbackRoadmap()` produces a fully personalised, data-driven roadmap from the stored state without any AI call.

---

## ✦ Project Layout

```
app/
  layout.tsx             Root layout (cursor, curtain, transitions)
  page.tsx               Landing (AI Gatekeeper)
  economy/page.tsx
  time/page.tsx
  effort/page.tsx
  health/page.tsx        ← new
  convergence/page.tsx
  oracle/page.tsx
  api/gatekeeper/        AI routing endpoint
  api/oracle/            AI roadmap endpoint

components/
  gatekeeper/            GlowOrb, Gatekeeper chat interface
  economy/               UploadZone, LeakDashboard, LeakHeatmap, LeakNetwork
  time/                  TimeInputPanel, ShatterCanvas, TimeStats
  effort/                ProductSelector, GlobeScene, StageTimeline
  health/                HolographicBody, HabitPanel, HealthRadar, HealthStats  ← new
  convergence/           DualAxisChart, ConvergenceStats
  oracle/                OraclePage, OracleMasonry
  three/                 StarField
  ui/                    ChapterHero, ChapterNav, MagButton, etc.

lib/
  types.ts               All shared types including HealthProfile, HealthResult
  store.ts               Zustand store with health slice
  health-model.ts        Score computation, HABIT_PRESETS, HEALTH_PLAYBOOK  ← new
  intent.ts              Deterministic router (now routes to /health)
  analysis.ts            Leak detection engine
  oracle.ts              Context builder + fallback roadmap (body cards)
  time-model.ts          Time loss computation
  csv.ts / sample.ts     CSV parsing + synthetic ledger
  supply-chains.ts       4 product supply chain datasets
  format.ts / gsap.ts / hooks.ts / chapters.ts / ui-store.ts
```

---

## ✦ Design System

| Token | Value | Use |
|---|---|---|
| `--ink` | `#05060a` | Background |
| `--cy` | `#22f2ff` | Economy + primary accent |
| `--vi` | `#a855f7` | Time + Oracle |
| `--em` | `#ff7a1a` | Effort + surges |
| `--fe` | `#ff3d81` | Bad states / fees |
| `--bio` | `#3dffb5` | Health (new) |

Typography: **Space Grotesk** (display) + **Inter** (body)

---

## ✦ Deploy to Vercel

```bash
vercel deploy
# Set environment variable: OPENAI_API_KEY
```

The app works **100% without an API key** — AI features gracefully fall back to deterministic logic.
