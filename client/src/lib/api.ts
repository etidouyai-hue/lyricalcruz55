import { supabase, isSupabaseConfigured, getEdgeFunctionUrl } from './supabase';
import { Review, Like } from '@shared/schema';

// Likes API
export async function getLikeCount(postSlug: string): Promise<number> {
  if (!isSupabaseConfigured) {
    // Fallback to localStorage
    const stored = localStorage.getItem(`likes-${postSlug}`);
    return stored ? parseInt(stored, 10) : 0;
  }

  try {
    const { data, error } = await supabase!
      .from('likes')
      .select('count')
      .eq('post_slug', postSlug)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    return data?.count || 0;
  } catch (error) {
    console.error('Error fetching like count:', error);
    return 0;
  }
}

export async function incrementLike(postSlug: string): Promise<number> {
  if (!isSupabaseConfigured) {
    // Fallback to localStorage
    const current = parseInt(localStorage.getItem(`likes-${postSlug}`) || '0', 10);
    const newCount = current + 1;
    localStorage.setItem(`likes-${postSlug}`, newCount.toString());
    return newCount;
  }

  try {
    // Call Edge Function for rate-limited, secure increment
    const url = getEdgeFunctionUrl('increment-like');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ post_slug: postSlug }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to increment like');
    }

    const { count } = await response.json();
    return count;
  } catch (error) {
    console.error('Error incrementing like:', error);
    throw error;
  }
}

// Reviews API
export async function getReviews(postSlug: string): Promise<Review[]> {
  if (!isSupabaseConfigured) {
    // Fallback to localStorage
    const stored = localStorage.getItem(`reviews-${postSlug}`);
    return stored ? JSON.parse(stored) : [];
  }

  try {
    const { data, error } = await supabase!
      .from('reviews')
      .select('*')
      .eq('post_slug', postSlug)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function submitReview(review: {
  post_slug: string;
  name: string;
  email?: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  if (!isSupabaseConfigured) {
    // Fallback to localStorage
    const newReview: Review = {
      id: Date.now().toString(),
      post_slug: review.post_slug,
      name: review.name,
      email: review.email || null,
      rating: review.rating,
      comment: review.comment,
      created_at: new Date().toISOString(),
    };

    const existing = JSON.parse(
      localStorage.getItem(`reviews-${review.post_slug}`) || '[]'
    );
    existing.unshift(newReview);
    localStorage.setItem(`reviews-${review.post_slug}`, JSON.stringify(existing));

    return newReview;
  }

  try {
    // Call Edge Function for rate-limited, secure submission
    const url = getEdgeFunctionUrl('submit-review');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(review),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit review');
    }

    const { review: newReview } = await response.json();
    return newReview;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

// Admin API
export async function getAllReviews(): Promise<Review[]> {
  if (!isSupabaseConfigured) {
    // Fallback to localStorage
    const allReviews: Review[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reviews-')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          allReviews.push(...JSON.parse(stored));
        }
      }
    }
    allReviews.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return allReviews;
  }

  try {
    const { data, error } = await supabase!
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return [];
  }
}

export async function updateReview(reviewId: string, updates: {
  name?: string;
  rating?: number;
  comment?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    // Fallback to localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reviews-')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const reviews: Review[] = JSON.parse(stored);
          const updated = reviews.map(r =>
            r.id === reviewId ? { ...r, ...updates } : r
          );
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    }
    return;
  }

  try {
    const { error } = await supabase!
      .from('reviews')
      .update(updates)
      .eq('id', reviewId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

export async function deleteReview(reviewId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    // Fallback to localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reviews-')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const reviews: Review[] = JSON.parse(stored);
          const filtered = reviews.filter(r => r.id !== reviewId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
    return;
  }

  try {
    const { error } = await supabase!
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

// Auth API
export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    // Fallback to simple check
    if (email === 'admin@poetry.com' && password === 'admin123') {
      localStorage.setItem('admin-auth', 'true');
      return { user: { email } };
    }
    throw new Error('Invalid credentials');
  }

  try {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    localStorage.removeItem('admin-auth');
    return;
  }

  try {
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export async function getSession() {
  if (!isSupabaseConfigured) {
    const auth = localStorage.getItem('admin-auth');
    return auth === 'true' ? { user: { email: 'admin@poetry.com' } } : null;
  }

  try {
    const { data, error } = await supabase!.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}
