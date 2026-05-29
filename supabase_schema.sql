-- SUPABASE DATABASE SCHEMA WITH EXACT JAVASCRIPT-COMPATIBLE COLUMN CASING
-- Run this script in the SQL Editor of your Supabase Dashboard to bootstrap the tables.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
    id text primary key,
    name text not null,
    email text unique not null,
    type text not null, -- Superadmin, Manajemen, Teknis, Store Manager
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ASSETS TABLE
create table if not exists public.assets (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    code text unique not null,
    condition text not null, -- Baru, Bekas
    placement text not null,
    outlet text not null,
    date text not null, -- format: YYYY-MM-DD
    verifier text not null,
    photo text not null,
    description text,
    price numeric default 0 not null,
    category text,
    unit text default 'Pcs',
    quantity bigint default 1 not null,
    ownership text,
    priority text,
    status text default 'Normal'::text not null, -- Normal, Emergency, Maintenance
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. REPORTS TABLE
create table if not exists public.reports (
    id text primary key default uuid_generate_v4()::text,
    outlet text not null,
    placement text not null,
    name text not null,
    code text not null,
    issue text not null,
    "desc" text not null,
    photo text not null,
    reporter text not null,
    timestamp text not null, -- ISO String
    category text not null,
    priority text,
    status text default 'pending'::text not null, -- pending, resolved
    "solverInfo" jsonb, -- Matches solverInfo?: { verifier, desc, photo, resolvedAt }
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ASSET_ACTIVITIES TABLE
create table if not exists public.asset_activities (
    id text primary key default uuid_generate_v4()::text,
    "assetCode" text not null,
    type text not null, -- Created, Emergency, Resolved, Edited
    description text not null,
    "user" text not null,
    timestamp text not null, -- ISO String
    "reportId" text,
    photo text,
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PROCUREMENTS TABLE
create table if not exists public.procurements (
    id text primary key default uuid_generate_v4()::text,
    "itemName" text not null,
    quantity bigint default 1 not null,
    unit text not null,
    description text not null,
    category text not null,
    "pricePerUnit" numeric default 0 not null,
    outlet text not null,
    "procurementVia" text not null,
    "totalPrice" numeric default 0 not null,
    timestamp text not null, -- ISO String
    "createdBy" text not null,
    photo text,
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. VENDORS TABLES
create table if not exists public.vendors_service (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    "companyName" text not null,
    whatsapp text not null,
    "socialMedia" text not null,
    category text not null,
    type text default 'Service'::text not null,
    description text,
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.vendors_procurement (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    "companyName" text not null,
    whatsapp text not null,
    "socialMedia" text not null,
    category text not null,
    type text default 'Procurement'::text not null,
    description text,
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. GUIDES TABLE
create table if not exists public.guides (
    id text primary key default uuid_generate_v4()::text,
    title text not null,
    category text not null,
    content text not null,
    "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. CATEGORY/MASTER TABLES
create table if not exists public.category_outlets (
    id text primary key default uuid_generate_v4()::text,
    name text unique not null
);

create table if not exists public.category_placements (
    id text primary key default uuid_generate_v4()::text,
    name text unique not null
);

create table if not exists public.category_vendors (
    id text primary key default uuid_generate_v4()::text,
    name text unique not null
);

create table if not exists public.category_ownerships (
    id text primary key default uuid_generate_v4()::text,
    name text unique not null
);

create table if not exists public.category_priorities (
    id text primary key default uuid_generate_v4()::text,
    name text unique not null
);

create table if not exists public.category_guides (
    id text primary key default uuid_generate_v4()::text,
    name text unique not null
);

-- 9. SEED INITIAL BASE CATEGORIES/RECORDS FOR COMPATIBILITY
insert into public.category_outlets (name) values 
('Main Office'), ('Warehouse A'), ('Retail Store 1'), ('Retail Store 2')
on conflict (name) do nothing;

insert into public.category_placements (name) values 
('Lantai 1'), ('Lantai 2'), ('Gudang Belakang'), ('Kamar Depan')
on conflict (name) do nothing;

insert into public.category_ownerships (name) values 
('Pribadi'), ('Sewa'), ('Perusahaan')
on conflict (name) do nothing;

insert into public.category_priorities (name) values 
('Rendah'), ('Sedang'), ('Tinggi'), ('Kritis')
on conflict (name) do nothing;

-- Set up Row Level Security (RLS)
-- For development simplicity, we allow all authenticated / anonymous operations.
-- You can harden these policies as needed for production.

alter table public.users enable row level security;
alter table public.assets enable row level security;
alter table public.reports enable row level security;
alter table public.asset_activities enable row level security;
alter table public.procurements enable row level security;
alter table public.vendors_service enable row level security;
alter table public.vendors_procurement enable row level security;
alter table public.guides enable row level security;
alter table public.category_outlets enable row level security;
alter table public.category_placements enable row level security;
alter table public.category_vendors enable row level security;
alter table public.category_ownerships enable row level security;
alter table public.category_priorities enable row level security;
alter table public.category_guides enable row level security;

-- Public read/write policy helper (simplified onboarding)
drop policy if exists "Allow public access to users" on public.users;
drop policy if exists "Allow public access to users" on users;
create policy "Allow public access to users" on public.users for all using (true) with check (true);

drop policy if exists "Allow public access to assets" on public.assets;
drop policy if exists "Allow public access to assets" on assets;
create policy "Allow public access to assets" on public.assets for all using (true) with check (true);

drop policy if exists "Allow public access to reports" on public.reports;
drop policy if exists "Allow public access to reports" on reports;
create policy "Allow public access to reports" on public.reports for all using (true) with check (true);

drop policy if exists "Allow public access to activities" on public.asset_activities;
drop policy if exists "Allow public access to activities" on asset_activities;
create policy "Allow public access to activities" on public.asset_activities for all using (true) with check (true);

drop policy if exists "Allow public access to procurements" on public.procurements;
drop policy if exists "Allow public access to procurements" on procurements;
create policy "Allow public access to procurements" on public.procurements for all using (true) with check (true);

drop policy if exists "Allow public access to vendors_service" on public.vendors_service;
drop policy if exists "Allow public access to vendors_service" on vendors_service;
create policy "Allow public access to vendors_service" on public.vendors_service for all using (true) with check (true);

drop policy if exists "Allow public access to vendors_procurement" on public.vendors_procurement;
drop policy if exists "Allow public access to vendors_procurement" on vendors_procurement;
create policy "Allow public access to vendors_procurement" on public.vendors_procurement for all using (true) with check (true);

drop policy if exists "Allow public access to guides" on public.guides;
drop policy if exists "Allow public access to guides" on guides;
create policy "Allow public access to guides" on public.guides for all using (true) with check (true);

drop policy if exists "Allow public access to category_outlets" on public.category_outlets;
drop policy if exists "Allow public access to category_outlets" on category_outlets;
create policy "Allow public access to category_outlets" on public.category_outlets for all using (true);

drop policy if exists "Allow public access to category_placements" on public.category_placements;
drop policy if exists "Allow public access to category_placements" on category_placements;
create policy "Allow public access to category_placements" on public.category_placements for all using (true);

drop policy if exists "Allow public access to category_vendors" on public.category_vendors;
drop policy if exists "Allow public access to category_vendors" on category_vendors;
create policy "Allow public access to category_vendors" on public.category_vendors for all using (true);

drop policy if exists "Allow public access to category_ownerships" on public.category_ownerships;
drop policy if exists "Allow public access to category_ownerships" on category_ownerships;
create policy "Allow public access to category_ownerships" on public.category_ownerships for all using (true);

drop policy if exists "Allow public access to category_priorities" on public.category_priorities;
drop policy if exists "Allow public access to category_priorities" on category_priorities;
create policy "Allow public access to category_priorities" on public.category_priorities for all using (true);

drop policy if exists "Allow public access to category_guides" on public.category_guides;
drop policy if exists "Allow public access to category_guides" on category_guides;
create policy "Allow public access to category_guides" on public.category_guides for all using (true);

-- Indexes for performance
create index if not exists idx_assets_code on public.assets(code);
create index if not exists idx_reports_code on public.reports(code);
create index if not exists idx_activities_asset_code on public.asset_activities("assetCode");
