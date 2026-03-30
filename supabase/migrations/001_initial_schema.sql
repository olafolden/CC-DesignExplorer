-- Design Explorer v2 — Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_user_id on projects(user_id);

create table datasets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  columns_meta jsonb not null default '[]'::jsonb,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_datasets_project_id on datasets(project_id);
create index idx_datasets_user_id on datasets(user_id);

create table designs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  design_key text not null,
  params jsonb not null default '{}'::jsonb,
  unique(dataset_id, design_key)
);

create index idx_designs_dataset_id on designs(dataset_id);
create index idx_designs_user_id on designs(user_id);

create table assets (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references designs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_type text not null check (asset_type in ('image', 'model')),
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  unique(design_id, asset_type)
);

create index idx_assets_design_id on assets(design_id);
create index idx_assets_user_id on assets(user_id);

create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('light', 'dark')),
  default_project_id uuid references projects(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table projects enable row level security;
alter table datasets enable row level security;
alter table designs enable row level security;
alter table assets enable row level security;
alter table user_preferences enable row level security;

-- Projects: users see only their own
create policy "Users can view own projects"
  on projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects"
  on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects"
  on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects"
  on projects for delete using (auth.uid() = user_id);

-- Datasets: users see only their own
create policy "Users can view own datasets"
  on datasets for select using (auth.uid() = user_id);
create policy "Users can insert own datasets"
  on datasets for insert with check (auth.uid() = user_id);
create policy "Users can update own datasets"
  on datasets for update using (auth.uid() = user_id);
create policy "Users can delete own datasets"
  on datasets for delete using (auth.uid() = user_id);

-- Designs: users see only their own
create policy "Users can view own designs"
  on designs for select using (auth.uid() = user_id);
create policy "Users can insert own designs"
  on designs for insert with check (auth.uid() = user_id);
create policy "Users can delete own designs"
  on designs for delete using (auth.uid() = user_id);

-- Assets: users see only their own
create policy "Users can view own assets"
  on assets for select using (auth.uid() = user_id);
create policy "Users can insert own assets"
  on assets for insert with check (auth.uid() = user_id);
create policy "Users can delete own assets"
  on assets for delete using (auth.uid() = user_id);

-- User preferences: users see only their own
create policy "Users can view own preferences"
  on user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences"
  on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences"
  on user_preferences for update using (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- NOTE: Create a storage bucket called 'design-assets' in the Supabase dashboard
-- Settings: Private bucket, allowed MIME types: image/png, image/jpeg, image/webp, model/gltf-binary, model/gltf+json
-- Then add these storage policies in the dashboard:
--
-- SELECT policy: (bucket_id = 'design-assets') AND (auth.uid()::text = (storage.foldername(name))[1])
-- INSERT policy: (bucket_id = 'design-assets') AND (auth.uid()::text = (storage.foldername(name))[1])
-- DELETE policy: (bucket_id = 'design-assets') AND (auth.uid()::text = (storage.foldername(name))[1])
