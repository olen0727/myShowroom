
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibvompahwxejhfvycstt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tdZNMInDZ6m_dUkhxT6-aw_GqBYhs6a';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data, error } = await supabase
        .from('carousel_projects')
        .select('id, title, display_order')
        .order('display_order');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Current Carousel Projects:');
        console.table(data);
    }
}

check();
