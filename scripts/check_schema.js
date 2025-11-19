
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjewdroayogftrudrtty.supabase.co';
const supabaseKey = 'sb_publishable_ojs5OPUrBgj0mr4WyWD7mA_UXKMII-P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Try to insert a dummy project with all fields to see if it errors
    const dummy = {
        name: 'Schema Test',
        color: '#000000',
        deadline: '2025-12-31',
        status: 'Planning',
        priority: 'Medium',
        scope: 'Test Scope',
        goal: 'Test Goal'
    };

    const { data, error } = await supabase.from('projects').insert([dummy]).select();

    if (error) {
        console.error('Error inserting dummy project:', error);
        // If error is about missing columns, we know.
    } else {
        console.log('Insert successful, columns exist:', data);
        // Cleanup
        await supabase.from('projects').delete().eq('id', data[0].id);
    }
}

checkSchema();
