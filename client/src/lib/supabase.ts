import { createClient } from '@supabase/supabase-js';

// Queste variabili dovranno essere configurate nel pannello di Netlify
// O nel file .env locale per lo sviluppo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tuo-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tua-anon-key';

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
