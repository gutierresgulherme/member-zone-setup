import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://qozsqbmertgivtsgugwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvenNxYm1lcnRnaXZ0c2d1Z3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjQzMzQsImV4cCI6MjA4NTI0MDMzNH0.xb6NnPuk7HN0heEdXvjUINyg8xNvKkTX1t-u6Aw41yU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
    },
});

// Re-export types for convenience
export type { Database };
