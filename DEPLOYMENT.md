# Deploying to Render

This guide will help you deploy your poetry application to Render.

## Prerequisites

- A GitHub account
- A Render account (free at [render.com](https://render.com))
- Your code pushed to a GitHub repository
- **Node.js 20.x or higher** (the app is configured to use Node 20.19.3)

## Pre-Deployment Checklist

Before deploying to Render, verify:

- ✅ All code is committed to Git
- ✅ Code is pushed to GitHub (main branch)
- ✅ `.gitignore` excludes `dist` and `node_modules` (already configured)
- ✅ `render.yaml` is present in the repository root (already included)
- ✅ Build works locally: `npm run build` completes without errors
- ✅ Environment variables are ready (see Step 5 below)

## Step 1: Prepare Your Repository

1. **Make sure all your code is committed to Git:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended - Fastest)

This project includes a `render.yaml` file that automates the entire deployment process.

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and configure everything
5. Click **Apply** to start the deployment

That's it! Render will automatically:
- Install dependencies with `npm install`
- Build your app with `npm run build`
- Start your server with `npm start`
- Assign a URL like `https://poetry-app.onrender.com`

### Option B: Manual Setup

If you prefer manual configuration:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

   | Field | Value |
   |-------|-------|
   | **Name** | `poetry-app` (or your preferred name) |
   | **Region** | Choose closest to your users |
   | **Branch** | `main` |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |

5. **Environment Variables** (click Advanced):
   - `NODE_ENV` = `production`
   - Add any other environment variables your app needs (API keys, database URLs, etc.)

6. **Choose a plan:**
   - Free tier: 512 MB RAM (sleeps after 15 min of inactivity)
   - Paid: Starting at $7/month for always-on service

7. Click **Create Web Service**

## Step 3: Monitor Deployment

1. Watch the **Logs** tab to see the build and deployment progress
2. Look for messages like:
   ```
   npm install completed
   npm run build completed
   serving on port XXXX
   Deploy succeeded
   ```
   (Note: Render assigns a port dynamically - your app is already configured to use it)
3. Once you see "Deploy succeeded", your app is live!

## Step 4: Access Your App

Your app will be available at the URL Render provides (e.g., `https://poetry-app.onrender.com`).

**Note:** On the free tier, the first request after 15 minutes of inactivity may take 30-60 seconds (cold start).

## Step 5: Configure Environment Variables (Required for Full Functionality)

This app uses Supabase for authentication and Resend for email notifications. You'll need to add these environment variables:

1. Go to your service in the Render Dashboard
2. Click **Environment** in the left sidebar
3. Add the following variables:

   **Required for Supabase:**
   - `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxx.supabase.co`)
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep this secret!)

   **Required for Email (Resend):**
   - `RESEND_API_KEY` - Your Resend API key for sending contact form emails

   **Optional:**
   - Any other custom environment variables your app needs

4. Click **Save Changes** - Render will automatically redeploy with the new variables

## Auto-Deployment

By default, Render automatically redeploys your app when you push to your connected branch:

```bash
git add .
git commit -m "Update feature"
git push
```

Render will automatically rebuild and redeploy!

## Database Configuration (Optional)

If you're using Supabase (as this app appears to be configured for):

1. Your Supabase database is hosted separately
2. Just add the Supabase environment variables in Render's Environment settings
3. The app will connect to your Supabase database automatically

If you want to use Render's PostgreSQL:

1. Click **New +** → **PostgreSQL** in Render Dashboard
2. Create a database
3. Copy the **Internal Database URL**
4. Add it as an environment variable in your web service: `DATABASE_URL`

## Build Architecture

Understanding what happens during deployment:

### Build Process
When you deploy to Render, `npm run build` executes two steps:

1. **Frontend Build** (`vite build`):
   - Compiles React/TypeScript frontend
   - Bundles and minifies assets
   - Outputs to `dist/public/` directory
   - Creates `index.html`, CSS, and JavaScript bundles

2. **Backend Build** (`esbuild`):
   - Bundles the Express server
   - Outputs to `dist/index.js`
   - Includes all API routes and middleware

### Production Structure
After build, the `dist` folder contains:
```
dist/
├── index.js           # Bundled Express server (entry point)
└── public/            # Frontend static files
    ├── index.html     # Main HTML file
    ├── assets/        # CSS and JS bundles
    ├── favicon.png
    └── poems.json
```

The Express server at `dist/index.js`:
- Serves static files from `dist/public/`
- Handles API routes at `/api/*`
- Falls back to `index.html` for client-side routing (React Router)
- Listens on the port specified by `process.env.PORT` (automatically set by Render)

### Important Notes
- The `dist` folder is **not** committed to Git (in `.gitignore`)
- Render builds it fresh on every deployment
- Build time is typically 15-30 seconds on Render's free tier

## Troubleshooting

### "Application failed to start"
- Check the logs for specific error messages
- Verify all environment variables are set correctly
- Make sure `npm run build` completes successfully locally
- Ensure Node version is 20.x or higher

### "Port binding error"
- The app is already configured to use `process.env.PORT` (checked in `server/app.ts`)
- Render automatically sets this variable, so no action needed

### "Build failed" errors
- Verify the build works locally: `npm run build`
- Check for TypeScript errors: `npm run check`
- Review Render build logs for specific error messages
- Ensure all dependencies are in `package.json` (not just devDependencies)

### Free tier sleep mode
- App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to a paid plan ($7/month) for always-on hosting

## Custom Domain (Optional)

To use your own domain:

1. Go to your service → **Settings** → **Custom Domains**
2. Add your domain
3. Update your DNS records as instructed by Render
4. SSL certificates are automatically provisioned

## Useful Commands

```bash
# View build logs
Click "Logs" tab in Render Dashboard

# Manually redeploy
Click "Manual Deploy" → "Deploy latest commit"

# Restart service
Click "Manual Deploy" → "Clear build cache & deploy"
```

## Cost Estimates

- **Free Tier:** Perfect for testing and small projects
  - 512 MB RAM
  - Sleeps after 15 min inactivity
  - 750 hours/month free compute

- **Starter Plan ($7/month):**
  - Always-on
  - 512 MB RAM
  - Better for production

- **Standard Plan ($25/month):**
  - 2 GB RAM
  - Better performance

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Render Status](https://status.render.com/)

---

**That's it!** Your poetry app should now be live on Render with automatic deployments on every push to GitHub.
