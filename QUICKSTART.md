# Quick Start (5 Minutes)

Get HuSig Lead Management running in 5 minutes.

## 1. Install (1 min)

```bash
# Create project
mkdir husig-leads && cd husig-leads

# Copy all artifact files into this directory
# (Use the file structure shown in README.md)

# Install dependencies
npm install
```

## 2. Supabase Setup (2 min)

```bash
# 1. Go to supabase.com → New Project
# 2. Copy Project URL and anon key
# 3. Create .env.local:

echo "NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here" > .env.local

# 4. In Supabase dashboard:
#    - Go to SQL Editor
#    - Paste contents of supabase/schema.sql
#    - Click Run
```

## 3. Run (1 min)

```bash
npm run dev
```

Open http://localhost:3000

## 4. Test (1 min)

1. Click "Sign Up"
2. Create account
3. Click "Add New Lead"
4. Fill form and submit
5. See your lead! ✨

## That's it!

**Next steps:**
- Add more leads
- Try filters and search
- Export to CSV
- Check lead scores

**Deploy to Vercel:**
```bash
git init
git add .
git commit -m "Initial commit"
# Push to GitHub, then import in Vercel
```

See SETUP_GUIDE.md for detailed instructions.