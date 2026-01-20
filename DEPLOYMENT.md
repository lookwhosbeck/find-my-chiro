# Quick Deployment Guide

## Step 1: Get Your Supabase API Keys

1. Go to: https://supabase.com/dashboard/project/rioybgvxkbsmwgqonbaa/settings/api
2. Copy these values:
   - **Project URL**: `https://rioybgvxkbsmwgqonbaa.supabase.co` (already set)
   - **anon public key**: Copy the `anon` `public` key from the API settings page

## Step 2: Create Local Environment File

Create `.env.local` in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://rioybgvxkbsmwgqonbaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
```

## Step 3: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: Find My Chiro app"

# Create repo on GitHub, then:
git remote add origin https://github.com/lookwhosbeck/find-my-chiro.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel (Easiest for Next.js)

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your `find-my-chiro` repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rioybgvxkbsmwgqonbaa.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
5. Click "Deploy"
6. Done! Your site will be live at `https://your-project.vercel.app`

**Option B: Via CLI**
```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

## Step 5: Update Supabase Auth Settings

After deployment, update Supabase:
1. Go to: https://supabase.com/dashboard/project/rioybgvxkbsmwgqonbaa/auth/url-configuration
2. Add your Vercel URL to:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: `https://your-project.vercel.app/**`

## That's It!

Your app will be live and connected to your Supabase database!
