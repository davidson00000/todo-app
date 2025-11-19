
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjewdroayogftrudrtty.supabase.co';
const supabaseKey = 'sb_publishable_ojs5OPUrBgj0mr4WyWD7mA_UXKMII-P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSeed() {
    const { data: projects, error } = await supabase.from('projects').select('*');

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    console.log('Current projects:', projects);

    if (!projects || projects.length === 0) {
        console.log('No projects found. Seeding test projects...');
        const { error: insertError } = await supabase.from('projects').insert([
            { name: 'Website Redesign' },
            { name: 'Mobile App' },
            { name: 'Marketing Campaign' }
        ]);

        if (insertError) {
            console.error('Error seeding projects:', insertError);
        } else {
            console.log('Successfully seeded projects.');
        }
    } else {
        console.log('Projects already exist.');
    }
}

checkAndSeed();
