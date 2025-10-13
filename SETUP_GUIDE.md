# HuSig Lead Management - Complete Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account (free tier works)
- Git

## Step-by-Step Setup

### 1. Create Project Directory

```bash
mkdir husig-leads
cd husig-leads
```

### 2. Initialize Next.js Project

```bash
npm init -y
```

Copy all the files I provided into the correct directories according to the structure shown in the artifacts.

### 3. Install Dependencies

```bash
npm install
```

This will install all packages from `package.json`.

### 4. Set Up Supabase

#### A. Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Create a new organization (if you don't have one)
4. Click "New project"
5. Fill in:
   - Project name: `husig-leads`
   - Database password: (create a strong password and save it)
   - Region: Choose closest to you
   - Pricing plan: Free
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

#### B. Get Your Supabase Credentials

1. In your Supabase dashboard, click on "Project Settings" (gear icon)
2. Go to "API" section
3. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Copy both values

#### C. Set Up Database Schema

1. In Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` from the artifacts
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

This creates:
- `profiles` table
- `leads` table
- Row Level Security policies
- Automatic profile creation trigger
- Indexes for performance

#### D. Verify Tables Created

1. Click "Table Editor" in left sidebar
2. You should see two tables:
   - `profiles`
   - `leads`

### 5. Configure Environment Variables

1. In your project root, create `.env.local` file:

```bash
touch .env.local
```

2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from Step 4B.

### 6. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 7. Create Your First User

1. Go to http://localhost:3000/signup
2. Fill in:
   - Full Name: Your name
   - Email: your@email.com
   - Password: (at least 8 characters)
   - Confirm Password: (same)
3. Click "Sign Up"
4. You'll be redirected to the dashboard

### 8. Verify Everything Works

1. Click "Add New Lead" button
2. Fill in the multi-step form
3. Submit the lead
4. You should see the lead in the leads list
5. Click on the lead to view details

## Troubleshooting

### "Supabase URL is required"

**Solution**: Make sure `.env.local` file exists and has correct values. Restart the dev server after creating/editing `.env.local`.

### "relation 'profiles' does not exist"

**Solution**: Run the SQL schema again in Supabase SQL Editor. Make sure there were no errors.

### Can't login after signup

**Solution**: 
1. Check Supabase Email Auth settings
2. Go to Authentication > Providers
3. Enable Email provider
4. Disable email confirmation (for testing)

### RLS policies blocking queries

**Solution**: 
1. Go to Supabase Table Editor
2. Click on `leads` table
3. Check "RLS is enabled" at top
4. Click "Policies" tab
5. Verify policies exist

### Lead form validation errors

**Solution**: Make sure all required fields are filled. Check browser console for specific errors.

## Default User Roles

- First user created: `intern` role (can only see their own leads)
- To make yourself admin:
  1. Go to Supabase Table Editor
  2. Click `profiles` table
  3. Find your row
  4. Edit `role` column to `admin`
  5. Save

## Testing the Application

### Test Lead Form

1. Go to `/leads/new`
2. Fill in Step 1 (Contact Info)
   - Try invalid email → should show error
   - Try without required fields → should prevent next
3. Fill in Step 2 (Company Info)
4. Fill in Step 3 (Project Details)
   - Try submitting without service interest → should show error
   - Try pain point with < 50 chars → should show error
5. Submit → should create lead and redirect to leads list

### Test Lead Scoring

Create leads with different attributes:
- C-Level + $250K+ budget + ASAP timeline = ~90 score (Hot)
- Manager + $50K budget + 3-6 months = ~40 score (Qualified)
- Individual Contributor + No budget + Flexible = ~15 score (Cold)

### Test Filters and Search

1. Create 5+ leads with different statuses
2. Try status filter dropdown
3. Try score filter dropdown
4. Try searching by name/email/company
5. Try combining filters

### Test CSV Export

1. Filter some leads
2. Click "Export CSV"
3. Open CSV file
4. Verify all filtered leads are exported with correct data

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/husig-leads.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"
7. Wait 2-3 minutes
8. Visit your deployed app!

## Security Checklist

- ✅ Row Level Security enabled
- ✅ Auth required for all dashboard routes
- ✅ Role-based access control implemented
- ✅ Input validation with Zod
- ✅ SQL injection protected (Supabase parameterized queries)
- ✅ XSS protected (React escapes by default)

## Next Steps

Now that your app is running, consider:

1. **Customize the scoring algorithm** in `src/lib/validations/lead.ts`
2. **Add more fields** to the lead form
3. **Integrate email** for sending outreach
4. **Add file uploads** for attachments
5. **Build email templates** for campaigns
6. **Create reports** with charts
7. **Add team collaboration** features

## Need Help?

- Check the README.md for feature documentation
- Review the code comments
- Check Supabase docs: https://supabase.com/docs
- Check Next.js docs: https://nextjs.org/docs

## Quick Reference

**Local URLs:**
- App: http://localhost:3000
- Login: http://localhost:3000/login
- Signup: http://localhost:3000/signup
- Dashboard: http://localhost:3000/dashboard
- Leads: http://localhost:3000/leads
- New Lead: http://localhost:3000/leads/new

**Supabase Dashboard:**
- Tables: Authentication > Users, Table Editor
- SQL: SQL Editor
- Logs: Logs > Postgres Logs
- API Docs: Auto-generated at Project Settings > API

Enjoy building with HuSig! 🚀