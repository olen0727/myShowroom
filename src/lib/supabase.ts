import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibvompahwxejhfvycstt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tdZNMInDZ6m_dUkhxT6-aw_GqBYhs6a';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
