# Verses & Reflections - Poetry Portfolio 📖✨

A modern, elegant poetry portfolio website with full backend integration for likes, reviews, and admin moderation.

## Features ✨

### Public Features
- 📚 **Poetry Collection** - Browse beautiful poems with elegant typography
- 🔍 **Search & Filter** - Find poems by title, category, or keywords
- ❤️ **Like System** - Show appreciation for your favorite poems
- ⭐ **Review & Rating** - Share your thoughts with star ratings
- 🌓 **Dark Mode** - Smooth toggle between light and dark themes
- 📱 **Mobile Responsive** - Flawless experience on all devices
- ✨ **Smooth Animations** - Line-by-line poem reveals, scroll effects
- 🎨 **Glassmorphism Design** - Modern, elegant card designs

### Admin Features
- 🔐 **Secure Authentication** - Supabase-powered admin login
- 📊 **Review Moderation** - Edit or delete reviews
- 📈 **Analytics Dashboard** - View stats on likes and reviews
- 🛠️ **Full CRUD** - Complete control over user content

## Tech Stack 🛠️

**Frontend:**
- React + TypeScript
- Tailwind CSS
- Wouter (routing)
- TanStack Query (data fetching)
- Shadcn UI Components

**Backend:**
- Supabase (Database, Auth, Edge Functions)
- PostgreSQL with Row Level Security
- Rate-limited Edge Functions for security

## Quick Start 🚀

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase (Optional)

If you want to use Supabase for persistent data:

1. Create a Supabase project at https://supabase.com
2. Follow the comprehensive setup guide in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
3. Add environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Note:** The app works perfectly without Supabase using localStorage as fallback!

### 3. Run the Development Server

```bash
npm run dev
```

Visit http://localhost:5000

## Project Structure 📁

```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages (Home, Poems, etc.)
│   │   ├── lib/            # Utilities (Supabase client, API)
│   │   └── hooks/          # Custom React hooks
│   └── public/
│       └── poems.json      # Poem data
├── shared/
│   └── schema.ts           # Shared TypeScript types
└── SUPABASE_SETUP.md       # Complete Supabase setup guide
```

## Adding Poems ✍️

Edit `public/poems.json`:

```json
{
  "slug": "unique-poem-slug",
  "title": "Poem Title",
  "date": "2024-11-21",
  "category": "Love",
  "excerpt": "First two lines of your poem...",
  "poem": [
    "Line one of your poem",
    "Line two of your poem",
    "",
    "Empty string for line break",
    "Continue your poem..."
  ]
}
```

## Admin Access 🔑

**Default Credentials (localStorage mode):**
- Email: `admin@poetry.com`
- Password: `admin123`

**With Supabase:**
Create an admin user in your Supabase dashboard with these credentials.

## Deployment 🌐

### Deploy to Replit
1. Already configured! Just click "Run"
2. Add environment variables in Replit Secrets
3. Your site is live!

### Deploy to Vercel/Netlify
1. Connect your GitHub repository
2. Add environment variables
3. Deploy Edge Functions to Supabase
4. Your site is live!

## Customization 🎨

### Change Colors

Edit `client/src/index.css` - all color tokens are defined in CSS variables.

### Change Fonts

Edit `tailwind.config.ts` - font families are configured there.

### Add Pages

1. Create new page in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link in `client/src/components/navbar.tsx`

## Features in Detail 🔍

### Like System
- One like per poem per user (tracked in localStorage)
- Atomic increments via Supabase RPC function
- Rate limiting prevents spam (5 second cooldown)

### Review System
- Star ratings (1-5 stars)
- Optional email field
- Rate limited (max 3 reviews per minute per IP)
- Admin moderation capabilities

### Dark Mode
- Persists in localStorage
- Smooth transitions
- Custom color palette for both modes

### Animations
- Line-by-line poem reveals on scroll
- Smooth page transitions
- Hover effects on cards
- Custom cursor glow effect (desktop only)

## Supabase Features 🔥

### Edge Functions
- **submit-review**: Rate-limited review submission
- **increment-like**: Atomic like increments

### RLS Policies
- Development mode (permissive for testing)
- Production mode (secure for deployment)

### Database
- `likes` table: Track poem likes
- `reviews` table: Store user reviews

## Troubleshooting 🔧

### "Supabase is not configured" warnings
→ Normal if you haven't set up Supabase. App uses localStorage fallback.

### Reviews/likes not persisting across devices
→ Set up Supabase for cloud persistence.

### Admin login not working
→ Check you're using the correct credentials. With Supabase, verify user exists in Auth.

## License 📄

MIT License - feel free to use this for your own poetry portfolio!

## Credits 💝

Built with love for poets and poetry lovers everywhere.

---

**Need help?** Check out [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for complete backend setup instructions.
