# DoLearn Frontend

This is the web app behind **DoLearn** — a curated 1-on-1 tutoring service where a real human team picks the right teacher for each child, instead of making parents scroll through hundreds of profiles. This README explains what the product does, who it's for, how the app is laid out, and how to run it. It's written so someone non-technical (an investor, a new hire, a friend kicking the tyres) can follow along, with the developer setup sitting at the end.

---

## 1. What DoLearn is, in plain language

Most online tutoring platforms work like a marketplace: the parent sees a grid of teacher profiles, reads bios, compares ratings, and picks someone. It sounds empowering, but in practice parents pick blind — they don't know which teacher actually fits their child.

DoLearn flips that. A parent fills a short **intake form** about their child (subject, goal, level, availability, budget). The DoLearn team reads every intake, reviews its vetted teacher roster, and **hand-picks the best match** — usually within 24 hours. Sessions then run live and 1-on-1 on Google Meet, straight from the parent's dashboard.

The promise: *the right teacher, hand-picked for your child.* One team owns the match from intake to the monthly progress report.

---

## 2. Who uses the app

The app has **four kinds of users**, and each one gets a different experience when they log in:

### Parents (primary customer)
Parents sign up, add their children (up to 4 per family), fill the intake, book sessions, pay, and watch progress. They never pick a teacher themselves — the DoLearn team does that for them.

### Students (the child)
Students get a dashboard designed to feel more like an app they want to open than a tool their parents make them use. It shows their **learning journey**, **badges**, **streaks**, a **skills radar** (how their strengths are growing across subjects), and links straight to their next session.

### Teachers
Teachers manage their schedule, propose new sessions to families, take notes after each session, track their earnings, and update their profile. They don't self-list or market themselves — DoLearn's team decides which teachers take on which children.

### Admins (the DoLearn team)
Admins are the humans behind the pairing. They review incoming intakes, assign teachers to children, approve or reject cancellation requests, monitor payments, and can deactivate accounts if something goes wrong. This is the control surface that makes the "curated" model actually work.

---

## 3. The end-to-end journey

Here's what happens from a family's first visit to a monthly report — and which part of this codebase handles each step.

1. **Landing page** ([`app/page.tsx`](<app/page.tsx>)). Explains the model, shows pricing, and invites the parent to start a free intake.
2. **Sign up / log in** ([`app/(auth)/register`](<app/(auth)/register>), [`app/(auth)/login`](<app/(auth)/login>)). The parent creates an account.
3. **Add a child** ([`app/(app)/family/children/new`](<app/(app)/family/children/new>)). Name, age, grade level, school, optional photo.
4. **Intake form** ([`components/forms/IntakeWizard.tsx`](components/forms/IntakeWizard.tsx)). A multi-step wizard that captures the subject(s), learning goal (exam prep, catch up, new skill, general improvement), current level, preferred teacher gender, preferred days and times per day, timezone, sessions per week, and budget tier.
5. **Admin review and pairing** ([`app/(app)/admin/intakes`](<app/(app)/admin/intakes>)). The DoLearn team sees every open intake in a queue, reviews it, and assigns a teacher from the active roster.
6. **Teacher accepts and proposes a session** ([`app/(app)/teacher/schedule`](<app/(app)/teacher/schedule>)). The assigned teacher proposes a first session time. The family accepts or declines.
7. **Live session on Google Meet** ([`app/(app)/family/sessions`](<app/(app)/family/sessions>), [`app/(app)/teacher/schedule`](<app/(app)/teacher/schedule>)). A Meet link appears on both dashboards when it's time.
8. **Teacher writes a note** ([`app/(app)/teacher/notes`](<app/(app)/teacher/notes>)). After every session: what was covered, how the student performed, a rating, and what to focus on next.
9. **Both sides confirm attendance**. The teacher and the family each confirm the session happened — only then does the teacher become eligible to be paid for that session.
10. **Payments** ([`app/(app)/family/payments`](<app/(app)/family/payments>), [`app/(app)/admin/payments`](<app/(app)/admin/payments>), [`app/(app)/teacher/earnings`](<app/(app)/teacher/earnings>)). Parents buy a single session or a bundle. International parents pay via Stripe; parents in Africa pay via Flutterwave in local currency. Teachers see their earnings and payout status.
11. **Progress tracking** ([`app/(app)/family/reports`](<app/(app)/family/reports>), [`app/(app)/family/learning`](<app/(app)/family/learning>)). The family sees the child's streak, journey milestones, skills radar, and a monthly PDF report.
12. **Notifications** (`app/(app)/*/notifications`). Important events — new intake, session proposed, cancellation requested, child deactivated — show up in each role's notification inbox.

---

## 4. What each role actually sees

Every authenticated page lives under one of three role surfaces. They share a dashboard shell ([`components/dashboard/DashboardShell.tsx`](components/dashboard/DashboardShell.tsx)) but show different navigation and content.

### Family surface — [`app/(app)/family`](<app/(app)/family>)
- **Overview** (`page.tsx`) — at-a-glance snapshot across all children.
- **Children** ([`children`](<app/(app)/family/children>)) — list of children; each has a detail page, an intake page, and an "add child" page.
- **Sessions** ([`sessions`](<app/(app)/family/sessions>)) — upcoming and past sessions, with Meet links and cancellation.
- **Learning** ([`learning`](<app/(app)/family/learning>)) — the student-facing view: badges, streaks, journey map, skills radar.
- **Payments** ([`payments`](<app/(app)/family/payments>)) — purchases, remaining sessions in a bundle, receipts.
- **Reports** ([`reports`](<app/(app)/family/reports>)) — monthly progress summaries.
- **Notifications** ([`notifications`](<app/(app)/family/notifications>)).

### Teacher surface — [`app/(app)/teacher`](<app/(app)/teacher>)
- **Overview** (`page.tsx`) — today's sessions, pending proposals, unread messages.
- **Schedule** ([`schedule`](<app/(app)/teacher/schedule>)) — upcoming sessions, propose a new session to a family, handle cancellations.
- **Students** ([`students`](<app/(app)/teacher/students>)) — the roster of assigned children.
- **Notes** ([`notes`](<app/(app)/teacher/notes>)) — write and review post-session notes.
- **Earnings** ([`earnings`](<app/(app)/teacher/earnings>)) — per-session earnings, pending vs. paid, payout history.
- **Profile** ([`profile`](<app/(app)/teacher/profile>)) — bio, subjects, qualifications, rate.
- **Reports** ([`reports`](<app/(app)/teacher/reports>)) — teaching activity summaries.
- **Notifications** ([`notifications`](<app/(app)/teacher/notifications>)).

### Admin surface — [`app/(app)/admin`](<app/(app)/admin>)
- **Overview** (`page.tsx`) — platform-wide metrics and open work.
- **Intakes** ([`intakes`](<app/(app)/admin/intakes>)) — the pairing queue: unmatched intakes at the top, with a flow to assign a teacher.
- **Teachers** ([`teachers`](<app/(app)/admin/teachers>)) — roster management, invite new teachers, terminate a teacher (with cascade to affected children).
- **Sessions** ([`sessions`](<app/(app)/admin/sessions>)) — every session across the platform, including cancellation approvals.
- **Payments** ([`payments`](<app/(app)/admin/payments>)) — parent payments in and teacher payouts out.
- **Reports** ([`reports`](<app/(app)/admin/reports>)) — operational health.
- **Notifications** ([`notifications`](<app/(app)/admin/notifications>)).

---

## 5. How sessions, money, and progress work

A few product rules worth knowing because they're baked into the code:

- **Pairing is manual, by design.** Parents never pick a teacher. If a pairing turns out to be wrong, DoLearn re-pairs at no extra cost.
- **Sessions are always live and 1-on-1** on Google Meet. No recorded lessons, no group classes.
- **Payouts gate on dual confirmation.** A teacher is only eligible for payout on a session after *both* the teacher and the family confirm it happened (see [`isSessionPayoutEligible`](lib/types/index.ts) in the types file).
- **Cancellations have a workflow.** Either side can request a cancellation with a reason; an admin approves or rejects.
- **Two payment rails.** Stripe for international parents, Flutterwave for parents in Africa. Both live side-by-side in the admin payments view.
- **Two plans at launch.** *Single Session* ($25–$40) for a no-commitment first try, and *Starter Bundle* ($100–$150 for 5 sessions) for families ready to see real change. No subscriptions, no lock-in.
- **Progress is tracked per session.** Every session note becomes a data point that feeds the child's streak, skills radar, and monthly PDF report.

---

## 6. Where the project is right now

This app is a **working, visually complete MVP running on mock data**. Every page you can navigate to is hooked up to realistic data, but that data lives in your browser's `localStorage` (a small storage area each browser keeps per website), seeded from fixture data in [`lib/mock`](lib/mock). Changes you make — adding a child, sending a proposal, assigning a teacher — persist only on your own machine.

The real backend (an Express + Prisma + Postgres API) is being built in parallel in [`../backend`](../backend). When endpoints are ready, the frontend's "store" modules (see Architecture below) will be swapped to call the API instead of reading from `localStorage` — the pages themselves won't need to change.

Translation for non-technical readers: **everything you see in the product works end-to-end today; the plumbing to persist data across devices and users is the next major piece of work.**

---

## 7. Tech stack (for the technically curious)

- **Next.js 15** with the App Router — the React framework that handles routing, server rendering, and build tooling.
- **React 19** + **TypeScript** in strict mode — the UI library and a typed flavour of JavaScript that catches mistakes before they ship.
- **Tailwind CSS 3** + **shadcn/ui** (on top of **Radix UI**) — utility-first styling with accessible, unstyled primitives we compose into our own components.
- **framer-motion** for animation, **lucide-react** for icons.
- **react-hook-form** + **zod** for forms and validation.
- **recharts** for data visualisations (skills radar, progress charts).
- **next-themes** for light/dark mode.

---

## 8. Project structure

```
app/
  page.tsx             # Public landing page
  (auth)/              # Route group — login, register (shared auth layout)
  (app)/               # Route group — authenticated app (shared dashboard shell)
    family/            # Parent and student views
    teacher/           # Teacher views
    admin/             # DoLearn team views

components/
  ui/                  # shadcn/ui primitives (button, card, dialog, etc.)
  dashboard/           # Dashboard building blocks (StatTile, SessionRow, SkillsRadarChart, ...)
  forms/               # IntakeWizard, LoginForm, RegisterForm, ChildProfileForm, ...
  Home/                # Landing-page sections
  theme-provider.tsx
  theme-toggle.tsx

lib/
  store/               # Per-role data stores, backed by localStorage
  mock/                # Seed data used on first load
  types/               # Shared TypeScript types (Child, Session, IntakeForm, ...)
  use-mounted.ts       # Hydration gate for localStorage reads
  utils.ts             # cn() + misc helpers

assests/               # Static images (spelling kept intentionally for import stability)
public/                # Next.js public assets served at the site root
```

Route groups `(auth)` and `(app)` let us share layouts without adding URL segments — so `/login` and `/family` both sit at the root of the site. The path alias `@/*` (configured in [tsconfig.json](tsconfig.json)) resolves to the project root, so imports look like `import { Button } from '@/components/ui/button'`.

---

## 9. Running it on your own machine

You'll need **Node.js 18.18 or newer** (Node 20 LTS is what we run). Node is the runtime that powers the build tools; install it from [nodejs.org](https://nodejs.org).

```bash
npm install     # download dependencies
npm run dev     # start the local dev server
```

Then open [http://localhost:3000](http://localhost:3000) in your browser. The first page is the public landing page; click *Start free intake* or go straight to `/register` to create a family account and explore.

No environment variables are required to run against mock data. A `.env` file is reserved for when the backend wiring lands.

---

## 10. Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 with hot reload. |
| `npm run build` | Produce a production build in `.next/`. |
| `npm run start` | Serve the production build locally. |
| `npm run lint` | Run ESLint (the Next.js rule set). |
| `npm run typecheck` | Run TypeScript (`tsc --noEmit`) to catch type errors. |

---

## 11. Architecture notes (for developers)

- **Mock data + localStorage.** Role-specific stores in [`lib/store`](lib/store) (`family.ts`, `teacher.ts`, `admin.ts`, `client.ts`) seed from [`lib/mock`](lib/mock) on first load and persist every change to `localStorage`. Pages never read storage directly — they call typed functions on the store, which makes swapping to a real API a one-layer change.
- **Hydration gate.** Any page that reads `localStorage` during render calls the [`useMounted`](lib/use-mounted.ts) hook and returns a loading shell on the first render. This prevents the React error you get when the server-rendered HTML and the first browser render disagree (because the server has no `localStorage`).
- **Intake wizard.** [`components/forms/IntakeWizard.tsx`](components/forms/IntakeWizard.tsx) is the multi-step parent intake. It writes to the family store and triggers an entry in the admin pairing queue.
- **Role-aware navigation.** [`components/dashboard/DashboardShell.tsx`](components/dashboard/DashboardShell.tsx) renders the nav based on the current route segment (`family` / `teacher` / `admin`), so each role only ever sees its own surface.
- **Theming.** Tailwind token classes (`bg-brand`, `text-accent2-500`, etc.) map to CSS variables defined in [`app/globals.css`](app/globals.css). Dark mode is driven by `next-themes` and toggled via [`components/theme-toggle.tsx`](components/theme-toggle.tsx).
- **Forms.** Every form uses `react-hook-form` + `zod` for schema-based validation, with the `@hookform/resolvers` bridge.
- **Animations.** `framer-motion` is used sparingly — mostly on the landing page and for card entrances in dashboard lists.

---

## 12. Peer dependencies (why there's an `.npmrc`)

This project runs on React 19, but the `cmdk` command-palette library (`cmdk@1.0.0`) still declares React 18 as a required peer dependency. An [`.npmrc`](.npmrc) with `legacy-peer-deps=true` tells `npm` to treat that mismatch as a warning instead of an error — cmdk works fine with React 19 at runtime, it just hasn't updated its declared peers. Without this file, `npm install` fails on strict CI environments like Vercel.

---

## 13. Deployment

The app deploys to **Vercel**. If the Vercel project is connected to the monorepo root (this repo contains `frontend/` and `backend/` side-by-side), set the project's **Root Directory** to `frontend`. Vercel then picks up `npm run build` automatically.

`images.unoptimized = true` is set in [next.config.js](next.config.js) because the production images are served from static imports rather than through Next.js's image optimiser — this keeps the deploy simple and predictable.

---

## 14. The backend

The API lives in [`../backend`](../backend) — a separate Express + Prisma service backed by Postgres. Until its endpoints are wired in here, all app data flows through the mock stores described in §11. When the switch happens, it happens inside `lib/store/*.ts`; component code stays the same.

---

## 15. Glossary

- **Intake** — the short form a parent fills out about their child. The input that drives every pairing.
- **Pairing** — the act of a DoLearn admin assigning a specific teacher to a specific child, based on the intake.
- **Proposal** — a session time a teacher suggests; the family accepts or declines it.
- **Bundle** — a pre-paid pack of sessions with the same teacher.
- **Payout** — money the platform pays a teacher, after both sides confirm the session happened.
- **Streak** — consecutive days a student has logged learning activity. Displayed on the student dashboard.
- **Skills radar** — a radar chart visualising the child's strength across each subject over time.
- **Route group** — a Next.js folder in parentheses like `(app)` or `(auth)`; it organises routes and shares a layout but doesn't show up in the URL.
- **Hydration** — the moment a React app "wakes up" in the browser and takes over the HTML the server sent. A "hydration mismatch" means the server and browser didn't agree on what to render, which we avoid with the `useMounted` gate.
