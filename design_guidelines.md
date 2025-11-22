# Design Guidelines for Poetry Portfolio Website

## Design Approach
**Reference-Based Approach**: Literary magazine meets premium portfolio aesthetic. Drawing inspiration from modern editorial platforms like Medium, Poetry Foundation, and Typewolf, combined with premium portfolio sites.

## Core Design Principles
- Modern minimal elegance with literary sophistication
- Emotion-driven reading experience
- Typography-first visual hierarchy
- Intentional whitespace and breathing room

## Typography System

**Primary Font Stack**:
- Headings: Elegant serif (Playfair Display, Libre Baskerville, or Lora)
- Body/Poems: Monospace or clean serif (IBM Plex Mono, EB Garamond)
- UI Elements: Clean sans-serif (Inter, DM Sans)

**Hierarchy**:
- Page titles: Large, elegant serif with generous letter-spacing
- Poem titles: Medium serif, refined weight
- Poem body: Monospace or serif, optimized line-height (1.8-2.0) for poetry reading
- UI text: Small, clean sans-serif

## Layout System

**Spacing Scale**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm

**Grid Strategy**:
- Soft, asymmetric grid for visual interest
- Max-width containers: max-w-4xl for poem content, max-w-6xl for archive grids
- Generous padding: py-16 to py-24 for sections

## Component Library

### Navigation
- Minimal fixed/sticky header with subtle backdrop blur
- Logo/site title on left, navigation links on right
- Dark mode toggle integrated seamlessly
- Mobile: Hamburger with smooth slide-in menu

### Home Page (5-6 sections)
- Hero: Typography-first with soft gradient background, no image needed - focus on elegant tagline/introduction
- Featured Poems: 2-3 column grid (lg:grid-cols-3 md:grid-cols-2) with glassmorphism cards
- Categories: Horizontal scroll or grid of category tags
- Recent Activity: Latest reviews or popular poems
- About Preview: Brief introduction with CTA to full about page
- Contact CTA: Simple, elegant invitation to connect

### Poems Archive
- Masonry or card grid layout (2-3 columns on desktop)
- Each card: poem title, date, category tag, excerpt (first 2 lines), like count
- Filter by category with smooth transitions
- Search functionality with real-time results

### Single Poem Page
- Centered, max-w-prose layout for optimal reading
- Poem title with elegant typography
- Date and category metadata
- Poem body with line-by-line fade-in animation on scroll
- Like button with heart icon and live count (subtle bounce on click)
- Star rating UI (5 stars, interactive hover states)
- Reviews section: Cards with name, rating, comment, timestamp
- Review submission form: Name, email (optional), star rating selector, comment textarea

### About Page
- Personal narrative with comfortable reading width (max-w-3xl)
- Optional: Author photo with soft border radius
- Writing philosophy/approach section
- Social links elegantly integrated

### Contact Page
- Simple form: Name, email, message
- Alternative contact methods (social links, email address)
- Minimal, centered layout

### Admin Panel
- Clean table layout for review management
- Action buttons: Edit (pencil icon), Delete (trash icon)
- Stats dashboard: Total likes, reviews per poem, recent activity
- Simple, functional design - not public-facing

## Visual Treatment

**Glassmorphism Cards**:
- Subtle backdrop-blur
- Semi-transparent backgrounds
- Soft border with low opacity
- Gentle shadow for depth

**Custom Cursor Glow**:
- Soft radial gradient following cursor
- Subtle, not distracting
- Disabled on mobile/touch devices

**Animations** (Use sparingly):
- Page transitions: Opacity fade + subtle slide (200-300ms)
- Poem line reveals: Stagger fade-in on scroll into view
- Like button: Gentle bounce on click
- Scroll-triggered reveals: Fade up from below
- Floating back-to-top button: Fade in after scrolling 300px

## Images
No hero image needed - typography-first approach. If images are used:
- Poem card thumbnails: Abstract, warm-toned imagery
- About page: Author portrait with soft, natural lighting
- All images: Soft border-radius (8-12px), subtle shadow

## Mobile Responsiveness
- Mobile-first: Single column stacking
- Touch-friendly tap targets (min 44px)
- Simplified navigation
- Reduced animation complexity
- Optimized font sizes for readability

## Dark Mode
- Toggle in header (moon/sun icon)
- Smooth transition between modes
- Warm neutrals in dark mode (not pure black)
- Adjust glassmorphism opacity for legibility