-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- LEADS TABLE
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Business Info
  company_name text not null,
  website text,
  phone text,
  address text,
  city text not null,
  category text not null,
  
  -- Contact Info
  email text,
  contact_first_name text default 'Titolare',
  contact_last_name text,
  
  -- Metadata
  source text check (source in ('website', 'facebook', 'maps', 'manual')) default 'maps',
  status text check (status in ('new', 'selected', 'sent', 'archived')) default 'new',
  
  -- Constraints
  constraint leads_email_unique unique (email),
  constraint leads_website_unique unique (website)
);

-- Enable Row Level Security (RLS)
alter table public.leads enable row level security;

-- Policies (Simple open access for MVP/Prototype phase - lock down later)
-- In production, you would use authenticated policies
create policy "Enable all access for authenticated users" 
on public.leads for all 
using (true) 
with check (true);

-- CAMPAIGNS TABLE (For future use)
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  subject text not null,
  body text not null,
  status text default 'draft',
  sent_count integer default 0
);

alter table public.campaigns enable row level security;

create policy "Enable all access for authenticated users" 
on public.campaigns for all 
using (true) 
with check (true);
