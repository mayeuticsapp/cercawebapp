import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulsfdtgdmwrupogdjjeu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsc2ZkdGdkbXdydXBvZ2RqamV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTcwMzAsImV4cCI6MjA4MTEzMzAzMH0.6gg3oZvksurkxKLifKtgUBv518AlEerrYNwFNGSDurU';

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
