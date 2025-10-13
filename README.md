# HuSig Lead Management Platform

A comprehensive B2B lead management system built with Next.js 14 and Supabase.

## Features

- ✅ Multi-step lead capture form with validation
- ✅ Lead scoring algorithm (automatic calculation)
- ✅ Dashboard with metrics and analytics
- ✅ Lead filtering, search, and sorting
- ✅ CSV export functionality
- ✅ Role-based access control (Admin, Manager, Intern)
- ✅ Real-time updates with Supabase
- ✅ Mobile responsive design
- ✅ Dark mode support

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

## Project Structure

```
husig-leads/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   └── (dashboard)/     # Protected dashboard pages
│   │       ├── dashboard/
│   │       ├── leads/
│   │       └── profile/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   └── leads/           # Lead-specific components
│   ├── lib/
│   │   ├── supabase/        # Supabase client setup
│   │   ├── validations/     # Zod schemas
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── database.ts      # TypeScript types
├── supabase/
│   └── schema.sql           # Database schema
└── public/
```

## Usage

### Creating a New Lead

1. Click "Add New Lead" button
2. Fill in the 3-step form:
   - **Step 1**: Contact Information
   - **Step 2**: Company Information
   - **Step 3**: Project Details
3. Submit to create the lead
4. Lead score is automatically calculated

### Lead Scoring Algorithm

Leads are scored 0-100 based on:

- **Seniority Level** (0-25 points)
  - C-Level: 25
  - VP/Director: 20
  - Manager: 15
- **Budget** (0-20 points)
  - $250K+: 20
  - $100K-$250K: 20
  - $50K-$100K: 15
  - $10K-$50K: 10
- **Timeline** (0-20 points)
  - ASAP: 20
  - 1-3 months: 15
  - 3-6 months: 10
- **Company Size** (0-15 points)
  - 501-1000: 15
  - 201-500: 15
  - 51-200: 10
- **Additional Data** (0-10 points)
  - Has LinkedIn: 5
  - Has phone: 5

**Score Categories:**
- 🔴 Hot (80-100): Immediate follow-up
- 🟠 Warm (60-79): Follow-up within 24h
- 🟡 Qualified (40-59): Nurture campaign
- ⚪ Cold (<40): Long-term nurture

### Managing Leads

- **Search**: Filter leads by name, email, or company
- **Status Filter**: Filter by lead status (New, Contacted, etc.)
- **Score Filter**: Filter by lead score category
- **Export**: Download filtered leads as CSV
- **Edit**: Update lead information
- **Delete**: Remove leads (Admin only)

### User Roles

- **Admin**: Full access, can delete leads
- **Manager**: Can view and edit all leads
- **Intern**: Can only view/edit their own leads

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Supabase Configuration

- Database is already configured via `schema.sql`
- Row Level Security (RLS) is enabled
- Auth is configured with email/password

## Roadmap

- [ ] Lead detail page
- [ ] Lead edit page
- [ ] Profile page
- [ ] Email integration
- [ ] Calendar integration for demo scheduling
- [ ] Activity timeline
- [ ] Notes and comments
- [ ] File attachments
- [ ] Email templates
- [ ] Automated follow-ups
- [ ] Analytics and reporting
- [ ] Team collaboration features
- [ ] LinkedIn scraper integration
- [ ] API integrations (Apollo, ZoomInfo)
