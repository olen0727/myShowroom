
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibvompahwxejhfvycstt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tdZNMInDZ6m_dUkhxT6-aw_GqBYhs6a';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    // We can't directly query schema with client, but we can try to select specific columns 
    // or rely on the error to tell us what's wrong.
    // However, the error 'Could not find the updated_at column' is pretty explicit.
    // Let's try to just insert a dummy record WITHOUT updated_at and see if it works.

    console.log('Testing insert without updated_at...');
    const { data, error } = await supabase
        .from('carousel_projects')
        .insert({
            title: 'Schema Test',
            description: 'Testing schema',
            image: '',
            display_order: 999
        })
        .select()
        .single();

    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Insert successful:', data);
        // Clean up
        await supabase.from('carousel_projects').delete().eq('id', data.id);
    }
}

checkSchema();
