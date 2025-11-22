# Supabase Setup Guide for Poetry Portfolio

This guide will help you set up the Supabase backend for your poetry portfolio website.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created
3. Your project's URL and anon key (found in Project Settings → API)

---

## Step 1: Database Tables Setup

Go to your Supabase SQL Editor and run the following SQL commands:

### Create Tables

```sql
-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  post_slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_post_slug ON reviews(post_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
```

---

## Step 2: RPC Function for Atomic Like Increments

This function safely increments like counts and prevents race conditions:

```sql
-- Function to increment like count atomically
CREATE OR REPLACE FUNCTION increment_like(p_post_slug TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Insert or update the like count
  INSERT INTO likes (post_slug, count, updated_at)
  VALUES (p_post_slug, 1, NOW())
  ON CONFLICT (post_slug)
  DO UPDATE SET
    count = likes.count + 1,
    updated_at = NOW()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;
```

---

## Step 3: Row Level Security (RLS) Policies

### Development Mode (Permissive - for testing)

Use this configuration during development:

```sql
-- Enable RLS on tables
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Development: Allow all operations (PERMISSIVE FOR TESTING ONLY)
CREATE POLICY "dev_likes_all"
ON likes FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "dev_reviews_all"
ON reviews FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
```

⚠️ **WARNING**: These policies allow unrestricted access. Only use during development!

### Production Mode (Secure - for deployment)

Before going live, replace development policies with these secure ones:

```sql
-- First, drop development policies
DROP POLICY IF EXISTS "dev_likes_all" ON likes;
DROP POLICY IF EXISTS "dev_reviews_all" ON reviews;

-- Production: Secure policies

-- LIKES TABLE
-- Anyone can read like counts
CREATE POLICY "prod_likes_select"
ON likes FOR SELECT
TO anon, authenticated
USING (true);

-- Only Edge Functions can insert/update likes (via service role)
-- No direct insert/update allowed from client

-- REVIEWS TABLE
-- Anyone can read reviews
CREATE POLICY "prod_reviews_select"
ON reviews FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated admin users can update/delete reviews
CREATE POLICY "prod_reviews_update"
ON reviews FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@poetry.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@poetry.com');

CREATE POLICY "prod_reviews_delete"
ON reviews FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@poetry.com');

-- Only Edge Functions can insert reviews (via service role)
-- No direct insert allowed from client
```

---

## Step 4: Supabase Edge Functions

Edge Functions provide secure, server-side endpoints for anonymous users to interact with your database.

### Setup Edge Functions

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Create the functions directory structure:
   ```bash
   mkdir -p supabase/functions
   ```

### Edge Function 1: Submit Review

Create `supabase/functions/submit-review/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: Track IPs and their request timestamps
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3 // Max 3 reviews per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const requests = rateLimitMap.get(ip) || []
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now)
  rateLimitMap.set(ip, recentRequests)
  
  return true
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before submitting another review.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { post_slug, name, email, rating, comment } = await req.json()

    // Validate inputs
    if (!post_slug || !name || !rating || !comment) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (name.length > 100 || comment.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Name or comment too long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role key (has full access)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        post_slug,
        name: name.trim(),
        email: email?.trim() || null,
        rating,
        comment: comment.trim(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, review: data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

### Edge Function 2: Increment Like

Create `supabase/functions/increment-like/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: Prevent spam likes from same IP
const likeRateLimitMap = new Map<string, { [slug: string]: number }>()
const LIKE_COOLDOWN = 5000 // 5 seconds cooldown per poem per IP

function checkLikeRateLimit(ip: string, slug: string): boolean {
  const now = Date.now()
  const ipLikes = likeRateLimitMap.get(ip) || {}
  
  const lastLikeTime = ipLikes[slug] || 0
  
  if (now - lastLikeTime < LIKE_COOLDOWN) {
    return false // Too soon, rate limited
  }
  
  // Update last like time
  ipLikes[slug] = now
  likeRateLimitMap.set(ip, ipLikes)
  
  return true
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Parse request body
    const { post_slug } = await req.json()

    // Validate input
    if (!post_slug) {
      return new Response(
        JSON.stringify({ error: 'Missing post_slug' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check rate limit
    if (!checkLikeRateLimit(clientIP, post_slug)) {
      return new Response(
        JSON.stringify({ error: 'Please wait before liking again' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call RPC function to increment like count atomically
    const { data, error } = await supabase
      .rpc('increment_like', { p_post_slug: post_slug })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, count: data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

### Deploy Edge Functions

```bash
# Deploy submit-review function
supabase functions deploy submit-review

# Deploy increment-like function
supabase functions deploy increment-like
```

---

## Step 5: Create Admin User

In your Supabase dashboard:

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Email: `admin@poetry.com`
4. Password: Create a secure password
5. Auto-confirm user: **Yes**

---

## Step 6: Environment Variables

Add these to your Replit project (or .env file):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

You can find these in your Supabase Project Settings → API.

---

## Testing Your Setup

### Test Database Connection

1. Go to Supabase SQL Editor
2. Run: `SELECT * FROM likes;`
3. Run: `SELECT * FROM reviews;`

Both should return empty results (no errors).

### Test RPC Function

```sql
SELECT increment_like('test-poem-slug');
SELECT * FROM likes WHERE post_slug = 'test-poem-slug';
```

You should see count = 1.

### Test Edge Functions

Use curl or Postman:

```bash
# Test submit-review
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/submit-review \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "post_slug": "test-slug",
    "name": "Test User",
    "rating": 5,
    "comment": "Great poem!"
  }'

# Test increment-like
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/increment-like \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "post_slug": "test-slug"
  }'
```

---

## Production Checklist

Before deploying to production:

- [ ] Switch from dev to production RLS policies
- [ ] Create admin user with strong password
- [ ] Test Edge Functions thoroughly
- [ ] Verify rate limiting works
- [ ] Enable email confirmations (optional)
- [ ] Set up database backups
- [ ] Monitor usage and performance

---

## Troubleshooting

### "relation does not exist" error
- Make sure you ran all SQL commands to create tables

### "permission denied" error
- Check RLS policies are set up correctly
- Verify you're using the correct API keys

### Edge Function not working
- Check function logs in Supabase dashboard
- Verify environment variables are set
- Ensure CORS headers are included

### Rate limiting too strict
- Adjust `MAX_REQUESTS_PER_WINDOW` and `LIKE_COOLDOWN` constants in Edge Functions

---

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Edge Functions Guide: https://supabase.com/docs/guides/functions

---

## Summary

You now have:
✅ Database tables for likes and reviews
✅ Atomic like increment function
✅ Secure RLS policies (dev and production modes)
✅ Edge Functions for anonymous interactions
✅ Rate limiting to prevent spam
✅ Admin authentication setup

Your poetry portfolio is ready to accept likes and reviews securely!
