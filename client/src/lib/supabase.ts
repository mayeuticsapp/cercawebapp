import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LeadDB = {
  id: string;
  created_at: string;
  company_name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  category: string;
  email: string | null;
  source: 'website' | 'facebook' | 'maps' | 'manual';
  status: 'new' | 'selected' | 'sent' | 'archived';
};
