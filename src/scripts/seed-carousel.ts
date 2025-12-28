
import { createClient } from '@supabase/supabase-js';

// Use values from .env or fallbacks from src/lib/supabase.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibvompahwxejhfvycstt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tdZNMInDZ6m_dUkhxT6-aw_GqBYhs6a';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MOCK_PROJECTS = [
    {
        title: 'Project Alpha',
        description: 'A cutting-edge web application built with Next.js and Supabase.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop', // Placeholder
        tags: ['Next.js', 'React', 'Supabase'],
        demo_url: 'https://example.com',
        github_url: 'https://github.com/example/alpha',
        display_order: 1
    },
    {
        title: 'Design System Beta',
        description: 'A comprehensive design system for enterprise applications.',
        image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2070&auto=format&fit=crop',
        tags: ['Figma', 'CSS', 'Storybook'],
        demo_url: 'https://example.com',
        github_url: 'https://github.com/example/beta',
        display_order: 2
    },
    {
        title: 'Mobile App Gamma',
        description: 'Cross-platform mobile experience using React Native.',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2070&auto=format&fit=crop',
        tags: ['React Native', 'Mobile', 'iOS'],
        demo_url: 'https://example.com',
        github_url: 'https://github.com/example/gamma',
        display_order: 3
    }
];

async function seed() {
    console.log('Starting seed process...');

    // Clear existing data
    console.log('Clearing existing data...');
    const { error: deleteError } = await supabase
        .from('carousel_projects')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that is always true for UUIDs typically, or just use neq id 0)

    // Supabase delete requires a where clause.
    // Let's use a simpler approach: select all IDs then delete them.
    // Or validly, delete where id is not null.

    if (deleteError) {
        console.error('Error clearing data:', deleteError);
        return;
    }

    console.log('Seeding new mock data...');
    const { error } = await supabase
        .from('carousel_projects')
        .insert(MOCK_PROJECTS);

    if (error) {
        console.error('Error inserting data:', error);
    } else {
        console.log('Successfully seeded new projects!');
    }
}

seed();
