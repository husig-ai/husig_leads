# HuSig Lead Management Platform

A comprehensive B2B lead management system built with Next.js 14 and Supabase.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: shadcn/ui, Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd husig-leads
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon/public key

### 4. Create database tables

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create tables and policies

### 5. Configure environment variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

