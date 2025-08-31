# Vercel Deployment Guide

This guide will help you deploy your StoryMagic application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Your code should be in a Git repository
3. **Supabase Project**: Your backend is already set up on Supabase

## Architecture Overview

This deployment uses a **hybrid architecture**:

- **Frontend (Vercel)**: React application with Vite build
- **Backend (Supabase)**: Edge Functions, Database, Storage, Auth
- **Communication**: Frontend makes API calls to Supabase Edge Functions

**Why this architecture?**
- Supabase Edge Functions run on Deno runtime (not compatible with Vercel)
- Vercel provides excellent frontend hosting and CDN
- Supabase provides robust backend services
- Best of both worlds: fast frontend + powerful backend

## Step 1: Prepare Your Repository

### 1.1 Environment Variables
Create a `.env.local` file in your project root (this will be ignored by Git):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://mpmbduoffaldnkhrkxxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE

# Feature Flags
VITE_GOOGLE_AUTH_ENABLED=false
```

### 1.2 Verify Configuration Files
Ensure these files exist in your project:
- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `vite.config.ts` - Vite configuration
- ✅ `index.html` - Entry point

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Import Project**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

3. **Environment Variables**:
   Add these in the Vercel dashboard:
   ```
   VITE_SUPABASE_URL=https://mpmbduoffaldnkhrkxxp.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE
   VITE_GOOGLE_AUTH_ENABLED=false
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Confirm settings
   - Deploy

## Step 3: Configure Custom Domain (Optional)

1. **Add Domain**:
   - Go to your project dashboard
   - Click "Settings" → "Domains"
   - Add your custom domain

2. **DNS Configuration**:
   - Follow Vercel's DNS instructions
   - Update your domain provider's DNS settings

## Step 4: Environment Variables in Production

### Frontend Environment Variables (Vercel)
These are configured in Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_GOOGLE_AUTH_ENABLED` | Enable/disable Google OAuth | `false` |

### Backend Environment Variables (Supabase)
These remain in Supabase Edge Functions (already configured):

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key |
| `RESEND_API_KEY` | Resend email API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |

**Important**: Your Supabase Edge Functions remain deployed on Supabase and are not deployed to Vercel. Only the frontend React application is deployed to Vercel.

## Step 5: Database Migration

Before testing, ensure you've applied the database migration:

1. **Go to Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the migration**:
   ```sql
   -- Copy and paste the content from:
   -- supabase/migrations/20250808120000_character_sheet_and_jobs.sql
   ```

## Step 6: Test Your Deployment

### Test Checklist

- [ ] **Homepage loads** without errors
- [ ] **Authentication works** (sign up/sign in)
- [ ] **Story creation** works for ≤3 pages (synchronous)
- [ ] **Story creation** works for >3 pages (queue system)
- [ ] **Image upload** and processing works
- [ ] **Story viewing** and sharing works

### Debug Common Issues

1. **Build Errors**:
   - Check Vercel build logs
   - Verify all dependencies are in `package.json`

2. **Environment Variables**:
   - Ensure all `VITE_*` variables are set in Vercel
   - Check browser console for missing variables

3. **CORS Issues**:
   - Verify Supabase URL is correct
   - Check Supabase CORS settings

4. **Database Issues**:
   - Ensure migration has been applied
   - Check Supabase logs for errors

## Step 7: Monitoring and Analytics

### Vercel Analytics
- Enable Vercel Analytics in your project dashboard
- Monitor performance and user behavior

### Error Monitoring
- Set up error tracking (e.g., Sentry)
- Monitor function logs in Supabase

## Step 8: Continuous Deployment

### Automatic Deployments
- Vercel automatically deploys on Git pushes
- Configure branch protection if needed

### Preview Deployments
- Each PR gets a preview URL
- Test changes before merging

## Troubleshooting

### Common Issues

1. **"Module not found" errors**:
   - Check import paths
   - Verify TypeScript configuration

2. **Environment variables not working**:
   - Ensure variables start with `VITE_`
   - Redeploy after adding variables

3. **Build timeout**:
   - Optimize bundle size
   - Check for large dependencies

4. **Function errors**:
   - Check Supabase function logs
   - Verify environment variables in Supabase

### Getting Help

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Project Issues**: Check the GitHub repository

## Next Steps

After successful deployment:

1. **Set up monitoring** and error tracking
2. **Configure custom domain** if needed
3. **Set up staging environment** for testing
4. **Implement CI/CD** workflows
5. **Monitor performance** and optimize

---

**Note**: Your backend (Supabase Edge Functions) remains on Supabase, while only the frontend is deployed to Vercel. This is the recommended architecture for this type of application. 