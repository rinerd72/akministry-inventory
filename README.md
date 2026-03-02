# Children's Ministry Inventory System

A full-featured inventory management system for children's ministries. Mobile-first, PWA-ready, with QR code scanning, role-based access control, and real-time stock tracking.

## Features

- **Inventory Management** — Track items with photos, locations, quantities, and categories
- **QR Code System** — Generate and scan QR codes to instantly access any item
- **Check-Out / Check-In** — Loan tracking with purpose, return dates, and audit history
- **Role-Based Access** — Admin / User / Guest with row-level security
- **Low-Stock Alerts** — Dashboard warnings + email alerts via Resend
- **CSV Reports** — Export inventory and checkout history
- **PWA** — Installable on iPhone/Android, works offline for browsing
- **Mobile-First** — Designed for phones and tablets

## Tech Stack

- **Next.js 14** (App Router, Server Components)
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Tailwind CSS + shadcn/ui**
- **Hosted on Vercel (free)**

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run all SQL from `supabase/schema.sql`
3. Note your **Project URL** and **Anon Key** from Settings > API

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
RESEND_API_KEY=re_your_key         # Optional: for email alerts
RESEND_FROM_EMAIL=noreply@church.org
```

### 3. Create First Admin User

In Supabase Dashboard > Authentication > Users > Invite User:
- Create your first user
- Then in SQL Editor, run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@church.org';
```

### 4. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
# Push to GitHub, then:
# 1. Create new Vercel project from your GitHub repo
# 2. Add all environment variables in Vercel settings
# 3. Deploy — done!
```

## PWA Icons

Generate icons at [pwabuilder.com](https://www.pwabuilder.com/imageGenerator) and place in `public/icons/`:
- `icon-192x192.png`
- `icon-512x512.png`

## Role Permissions

| Feature | Guest | User | Admin |
|---------|-------|------|-------|
| View items | Yes | Yes | Yes |
| Check out/in | | Yes | Yes |
| Add/edit items | | Yes | Yes |
| Delete items | | | Yes |
| Admin panel | | | Yes |

## QR Code Workflow

1. Add an item - QR code auto-generated
2. Print the QR label from the item detail page
3. Scan with any QR reader (or `/scan` in the app) - opens item page
4. Tap "Check Out" or "Check In"

## Important Notes

- **Supabase free tier** pauses after 1 week of inactivity
- **Camera on iOS** requires HTTPS (works automatically on Vercel)
- Items are **never hard-deleted** - soft delete keeps QR codes valid forever
- All changes are tracked in the **audit log** (admin-only)
