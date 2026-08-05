import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://frwobvgxpgfghdgyyirp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyd29idmd4cGdmZ2hkZ3l5aXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjA2OTQsImV4cCI6MjA4MjMzNjY5NH0.d9I-kVlPN5Ho75iTzoiX_VqX03jI8dHu3ZRAy955z7E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
