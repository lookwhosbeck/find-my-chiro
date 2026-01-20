# Quick Start - Push to GitHub

## Step 1: Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `find-my-chiro`
3. Choose public or private
4. **DO NOT** check "Initialize with README" (we already have one)
5. Click "Create repository"

## Step 2: Connect and Push
After creating the repo, run these commands:

```bash
git remote add origin https://github.com/lookwhosbeck/find-my-chiro.git
git push -u origin main
```

## Step 3: Get Supabase API Key
1. Go to: https://supabase.com/dashboard/project/rioybgvxkbsmwgqonbaa/settings/api
2. Copy the `anon` `public` key

## Step 4: Deploy to Vercel
1. Go to: https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `find-my-chiro` repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rioybgvxkbsmwgqonbaa.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
6. Click "Deploy"

Done! Your app will be live in ~2 minutes.
