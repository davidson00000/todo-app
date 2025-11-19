import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
const envPath = path.resolve(__dirname, '../.env');
const envFile = readFileSync(envPath, 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
        envVars[key.trim()] = values.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubtasksTable() {
    console.log('Checking subtasks table...');

    // Try to select from subtasks
    const { data, error } = await supabase.from('subtasks').select('*').limit(1);

    if (error) {
        console.log('Error accessing subtasks table:', error.message);
        if (error.code === '42P01') { // undefined_table
            console.log('Table does not exist. Please create it via SQL Editor or migration.');
            console.log(`
            CREATE TABLE subtasks (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );
        `);
        }
    } else {
        console.log('Subtasks table exists.');
        console.log('Sample data:', data);
    }
}

checkSubtasksTable();
