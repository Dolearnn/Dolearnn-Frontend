# DoLearn Frontend

This is the web app behind **DoLearn**, a curated 1-on-1 tutoring service where the DoLearn team matches each child with the right teacher instead of making parents scroll through a marketplace of profiles.

The README is written for both non-technical and technical readers. The product explanation comes first; setup details come later.

---

## What DoLearn Does

Parents sign up, add their children, and complete an intake form with the subject, goal, level, preferred days, preferred time blocks, timezone, and budget. Admin reviews the intake and assigns a vetted teacher. The teacher proposes a class time, the family accepts or declines, and both teacher and family use the same admin-assigned meeting link for class.

After each class, the teacher submits a session note. Both sides confirm attendance so admin has a reliable record for reports and teacher payouts.

## Users

**Families** create their own accounts, add students, complete intake forms, view proposed sessions, confirm attendance, request cancellations, manage payments, see reports, and pause/reactivate students.

**Teachers** do not self-register. Admin creates teacher accounts, assigns a default password, and teachers reset it later. Teachers can view assigned students, propose sessions within the student's availability, submit notes, confirm attendance, request cancellations, and track payouts.

**Admins** manage the platform: teacher creation, teacher/student matching, meeting links, cancellations, payments, payouts, reports, and notifications.

## Main Product Flow

1. A family signs up.
2. The family adds a child.
3. The family completes the child intake form.
4. Admin reviews the intake and assigns a teacher.
5. The teacher proposes a session based on the student's available day and time block.
6. The family accepts or declines the proposal.
7. Admin adds the meeting link for the confirmed session.
8. The class happens.
9. Teacher and family both confirm attendance.
10. Teacher submits a session note.
11. Admin uses verified attendance to process teacher payout.
12. Family, teacher, and admin can view monthly reports.

## Current Status

The frontend is now **API-first**. It calls the backend for authentication, role-based dashboards, students, intakes, teachers, sessions, notes, payments, payouts, reports, notifications, and learning goals.

The backend lives in [`../backend`](../backend). It is an Express + Prisma API backed by PostgreSQL.

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** and Radix UI primitives
- **React Query** for API data loading and cache invalidation
- **react-hook-form** and **zod** for forms and validation
- **framer-motion** for motion
- **recharts** for charts
- **lucide-react** for icons

## Project Structure

```txt
app/
  page.tsx             # Public landing page
  (auth)/              # Login/register pages
  (app)/               # Authenticated dashboards
    family/            # Family dashboard
    teacher/           # Teacher dashboard
    admin/             # Admin dashboard

components/
  ui/                  # Shared UI primitives
  dashboard/           # Dashboard cards, rows, charts, shell
  forms/               # Login, register, intake, child profile, password forms
  Home/                # Landing page sections

lib/
  api/                 # Typed API helpers
  types/               # Shared frontend types
  use-mounted.ts       # Client mount helper
  utils.ts             # cn() and shared utilities

public/                # Public assets
```

## Environment Variables

The frontend needs the backend API URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

For local development, use `.env.development` or `.env.local`.

For Vercel, set `NEXT_PUBLIC_API_URL` in the Vercel project environment variables and point it to the deployed backend URL.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Then open:

```txt
http://localhost:3000
```

Run the backend first if you want real login and dashboard data.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server. |
| `npm run build` | Build the production app. |
| `npm run start` | Serve the production build locally. |
| `npm run lint` | Run lint checks. |
| `npm run typecheck` | Run TypeScript checks. |

## Architecture Notes

- **API-first data flow:** pages use React Query and typed helpers from [`lib/api`](lib/api).
- **Role-based access:** auth storage keeps the logged-in user and role; `DashboardShell` redirects users to the correct dashboard.
- **Family registration:** families can create their own accounts.
- **Teacher registration:** teachers are created by admin with a default password and must change it.
- **Admin user:** the platform has one primary admin account created from the backend seed.
- **Attendance:** teacher and family both confirm a class happened before the teacher can be paid for it.
- **Cancellations:** family or teacher can request cancellation, but admin approves or rejects.
- **Payments:** parents pay DoLearn; DoLearn pays teachers monthly based on verified work.

## Deployment

The frontend deploys to **Vercel**.

If the GitHub repository contains `frontend/` and `backend/` side-by-side, set the Vercel project **Root Directory** to:

```txt
frontend
```

Make sure Vercel has:

```bash
NEXT_PUBLIC_API_URL=<your deployed backend api url>
```

## Backend

The backend lives in [`../backend`](../backend). It owns authentication, permissions, database persistence, teacher creation, student matching, session proposals, meeting links, attendance, cancellations, notifications, payments, payouts, and reports.

## Glossary

- **Intake:** the form a family fills for a child.
- **Pairing:** admin assigning a teacher to a student.
- **Proposal:** a session time suggested by a teacher.
- **Attendance:** confirmation from teacher and family that a class happened.
- **Payout:** money DoLearn pays a teacher after verified work.
- **Bundle:** prepaid pack of sessions.
- **Learning goal:** what a student is working toward.
