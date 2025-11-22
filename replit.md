# Verses & Reflections - Poetry Portfolio

## Overview

A modern, elegant poetry portfolio website featuring a curated collection of contemporary poetry. The application provides a rich reading experience with social features including likes and reviews, all wrapped in a literary magazine aesthetic with glassmorphism design and smooth animations.

The site serves both public readers and administrators, offering poem browsing, search/filtering, social interactions (likes/reviews), and admin moderation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- React with TypeScript for type safety and component architecture
- Wouter for lightweight client-side routing
- TanStack Query for server state management and data fetching with caching

**UI Component Strategy**
- Shadcn UI component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom theme configuration
- Custom CSS variables for theme flexibility (light/dark mode support)
- Glassmorphism design pattern with backdrop blur effects

**Design System**
- Typography-first approach with multiple font families (serif for poems, sans-serif for UI, monospace options)
- Custom color palette using HSL color space for dynamic theming
- Responsive grid layouts with mobile-first approach
- Animation system for line-by-line poem reveals and scroll effects

**State Management**
- Theme state managed via React Context (ThemeProvider)
- Form state handled by React Hook Form with Zod validation
- Server state cached and synchronized via TanStack Query
- Local storage fallbacks for likes when backend unavailable

**Key Features**
- Cursor glow effect (desktop only, touch detection)
- Back-to-top button with scroll detection
- Mobile-responsive navigation with hamburger menu
- SEO utilities for dynamic meta tag updates

### Backend Architecture

**Server Framework**
- Express.js server with dual entry points (development/production)
- Vite dev server integration for HMR in development
- Static file serving in production from compiled build

**Data Layer**
- In-memory storage implementation (MemStorage) as fallback
- Drizzle ORM configured for PostgreSQL migrations
- Supabase integration as primary backend service (optional)
- Storage interface pattern for swappable data providers

**API Design**
- RESTful principles with `/api` prefix convention
- Centralized route registration system
- Request/response logging middleware
- JSON body parsing with raw body preservation for webhooks

### Data Storage Solutions

**Primary: Supabase (Optional)**
- PostgreSQL database with Row Level Security
- Real-time subscriptions capability (unused but available)
- Edge Functions for serverless operations (increment-like endpoint)
- Built-in authentication system for admin users

**Schema Design**
- `likes` table: post_slug (PK), count, updated_at
- `reviews` table: id (UUID PK), post_slug, name, email, rating, comment, created_at
- Indexes on post_slug and created_at for query optimization
- RPC functions for atomic like increments to prevent race conditions

**Fallback: LocalStorage + Memory**
- Client-side localStorage for likes when Supabase unavailable
- In-memory Map structure for server-side data (development/testing)
- Graceful degradation when backend services unavailable

**Static Content**
- Poems stored as JSON file (`public/poems.json`)
- Served directly via Vite static assets
- No database queries required for poem content
- Enables fast loading and simple content management

### Authentication & Authorization

**Admin Authentication**
- Supabase Auth with email/password
- Session-based authentication with cookie storage
- Protected admin routes with session verification
- Sign-out functionality with session cleanup

**Security Considerations**
- Row Level Security policies in Supabase
- Rate limiting via Edge Functions
- Anon key used for client-side requests (public operations only)
- Admin operations require authenticated session

## External Dependencies

**Supabase Backend (Optional)**
- Database: PostgreSQL with Drizzle ORM
- Authentication: Email/password via Supabase Auth
- Edge Functions: Rate-limited like incrementing
- Configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables

**Neon Database Alternative**
- PostgreSQL database provider (alternative to Supabase)
- Serverless driver: @neondatabase/serverless
- Configured via DATABASE_URL environment variable
- Compatible with Drizzle ORM migrations

**Third-Party UI Libraries**
- Radix UI: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- Lucide React: Icon library for consistent iconography
- React Hook Form: Form state management and validation
- Zod: Schema validation for forms and API data

**Build & Development Tools**
- Vite: Build tool and dev server with HMR
- esbuild: Fast JavaScript bundler for production
- TypeScript: Type checking and enhanced DX
- Tailwind CSS: Utility-first CSS framework with PostCSS

**Fonts (Google Fonts)**
- Playfair Display / Libre Baskerville (serif, headings)
- IBM Plex Mono / Fira Code (monospace, poems)
- DM Sans / Inter (sans-serif, UI elements)
- Preconnected for performance optimization

**Optional Replit Plugins**
- Runtime error overlay for development
- Cartographer for code navigation
- Dev banner for environment awareness