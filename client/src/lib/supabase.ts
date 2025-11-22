import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client (will be null if credentials not provided)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = !!supabase;

// Helper to get Edge Function URL
export function getEdgeFunctionUrl(functionName: string): string {
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/functions/v1/${functionName}`;
}
