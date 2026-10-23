import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase URL and Anon Key directly from environment variables
const envSupabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const isBrowser = typeof window !== 'undefined';
const isHttps = isBrowser && window.location.protocol === 'https:';

// Permanent Cloudflare tunnel gateway for production / remote access
const CLOUDFLARE_TUNNEL_URL = 'https://api.foodfax.in';
const LOCAL_GATEWAY_URL = 'http://127.0.0.1:8000';

// When running on HTTPS (Vercel production), NEVER use http://127.0.0.1:8000 to avoid Mixed Content block!
let supabaseUrl: string = envSupabaseUrl || (isHttps ? CLOUDFLARE_TUNNEL_URL : LOCAL_GATEWAY_URL);
if (isHttps && supabaseUrl.startsWith('http://')) {
  supabaseUrl = CLOUDFLARE_TUNNEL_URL;
}

const supabaseAnonKey: string = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkyNTE3Njk3LCJleHAiOjE5NTAxOTc2OTd9.m-Kkdq0uf2fr0365ulaLFOW-kWdXO35kaZnJSV_oCwo';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).');
}

/**
 * Initialized Supabase client instance using environment variables.
 * Exported for use throughout the application for database operations,
 * authentication, and real-time subscriptions.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Alias for flexibility across different import conventions
export const supabaseClient: SupabaseClient = supabase;

/**
 * Returns the initialized Supabase client instance.
 */
export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

/**
 * Helper to verify database connectivity.
 */
export async function testSupabaseConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  tablesFound?: string[] 
}> {
  try {
    const verifiedTables: string[] = [];

    // Verify users table
    const { error: userError } = await supabase.from('users').select('id', { head: true, count: 'exact' });
    if (!userError) verifiedTables.push('users');

    // Verify shops table
    const { error: shopError } = await supabase.from('shops').select('id', { head: true, count: 'exact' });
    if (!shopError) verifiedTables.push('shops');

    // Verify orders table
    const { error: orderError } = await supabase.from('orders').select('id', { head: true, count: 'exact' });
    if (!orderError) verifiedTables.push('orders');

    if (verifiedTables.length > 0) {
      return {
        success: true,
        message: `Connected successfully to Supabase! Verified tables: ${verifiedTables.join(', ')}`,
        tablesFound: verifiedTables,
      };
    }

    const { error: authError } = await supabase.auth.getSession();
    if (!authError) {
      return { success: true, message: 'Connected to Supabase endpoint.' };
    }

    return { success: false, message: 'Could not reach Supabase tables.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection error' };
  }
}

// Default export of the client instance
export default supabase;
