-- =========================================================
-- Blood-chain Supabase schema (demo-ready)
-- Run in Supabase: Database -> SQL Editor
-- =========================================================

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('donor', 'hospital', 'blood_center');
  end if;
  if not exists (select 1 from pg_type where typname = 'slot_status') then
    create type public.slot_status as enum ('booked', 'confirmed', 'arrived', 'collected', 'completed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum ('pending', 'en_route', 'delivered', 'failed');
  end if;
end $$;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Current role helper (RLS uchun)
create or replace function public.current_role()
returns public.user_role
language sql
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

-- =========================================================
-- profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  role public.user_role not null default 'donor',

  -- Donor fields
  first_name text,
  last_name text,
  phone text,
  blood_group text check (blood_group in ('A','B','AB','O')),
  rh text check (rh in ('+','-')),
  weight_kg numeric,
  height_cm numeric,
  dob date,
  health_history jsonb default '{}'::jsonb,
  health_metrics jsonb default '{}'::jsonb,

  -- Hospital / Blood Center fields
  name text,
  region text,
  address text,

  -- Gamification
  total_donated_liters numeric not null default 0,
  badges jsonb default '[]'::jsonb,
  points integer not null default 0,
  last_donation_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create profile row on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_role public.user_role;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'donor')::public.user_role;

  insert into public.profiles (
    id,
    role,
    phone,
    first_name,
    last_name,
    blood_group,
    rh,
    weight_kg,
    height_cm,
    dob,
    health_history,
    name,
    region,
    address
  )
  values (
    new.id,
    v_role,
    new.raw_user_meta_data->>'phone',
    case when v_role = 'donor' then new.raw_user_meta_data->>'first_name' end,
    case when v_role = 'donor' then new.raw_user_meta_data->>'last_name' end,
    case when v_role = 'donor' then new.raw_user_meta_data->>'blood_group' end,
    case when v_role = 'donor' then new.raw_user_meta_data->>'rh' end,
    case when v_role = 'donor' then nullif(new.raw_user_meta_data->>'weight_kg','')::numeric end,
    case when v_role = 'donor' then nullif(new.raw_user_meta_data->>'height_cm','')::numeric end,
    case when v_role = 'donor' then nullif(new.raw_user_meta_data->>'dob','')::date end,
    case when v_role = 'donor' then coalesce(new.raw_user_meta_data->'health_history','{}'::jsonb) end,
    case when v_role in ('hospital','blood_center') then new.raw_user_meta_data->>'name' end,
    case when v_role in ('hospital','blood_center') then new.raw_user_meta_data->>'region' end,
    case when v_role in ('hospital','blood_center') then new.raw_user_meta_data->>'address' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================
-- donor_health_events
-- =========================================================
create table if not exists public.donor_health_events (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  hemoglobin numeric,
  infection_tests jsonb default '{}'::jsonb,
  measured_at date not null default (current_date),
  created_at timestamptz not null default now()
);

create index if not exists donor_health_events_donor_measured_at_idx
on public.donor_health_events(donor_id, measured_at desc);

-- =========================================================
-- donor_donations (gamification uchun)
-- =========================================================
create table if not exists public.donor_donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  center_id uuid references public.profiles(id) on delete set null,
  hospital_id uuid references public.profiles(id) on delete set null,

  blood_group text check (blood_group in ('A','B','AB','O')),
  rh text check (rh in ('+','-')),
  component text check (component in ('whole_blood','red_cells','platelets','plasma')),

  liters numeric not null check (liters > 0),
  donation_status text default 'completed',
  donated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- =========================================================
-- blood_inventory
-- =========================================================
create table if not exists public.blood_inventory (
  id uuid primary key default gen_random_uuid(),

  center_id uuid references public.profiles(id) on delete set null,
  hospital_id uuid references public.profiles(id) on delete set null,

  component text not null check (component in ('whole_blood','red_cells','platelets','plasma')),
  blood_group text not null check (blood_group in ('A','B','AB','O')),
  rh text not null check (rh in ('+','-')),

  quantity numeric not null check (quantity >= 0),
  expiry_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint blood_inventory_owner_check
    check ( (case when center_id is not null then 1 else 0 end) + (case when hospital_id is not null then 1 else 0 end) = 1 )
);

drop trigger if exists blood_inventory_set_updated_at on public.blood_inventory;
create trigger blood_inventory_set_updated_at
before update on public.blood_inventory
for each row execute function public.set_updated_at();

-- Upsert uchun unique indekslar (partial)
create unique index if not exists blood_inventory_center_uniq
on public.blood_inventory(center_id, blood_group, rh, component)
where center_id is not null;

create unique index if not exists blood_inventory_hospital_uniq
on public.blood_inventory(hospital_id, blood_group, rh, component)
where hospital_id is not null;

-- =========================================================
-- emergency_requests
-- =========================================================
create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),

  hospital_id uuid references public.profiles(id) on delete set null,
  center_id uuid references public.profiles(id) on delete set null,

  blood_group text check (blood_group in ('A','B','AB','O')),
  component text check (component in ('whole_blood','red_cells','platelets','plasma')),
  quantity numeric check (quantity > 0),

  status text default 'pending',
  donor_id uuid references public.profiles(id) on delete set null,
  donor_approved boolean not null default false,

  delivery_status public.delivery_status not null default 'pending',
  delivery_eta_demo_minutes integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists emergency_requests_set_updated_at on public.emergency_requests;
create trigger emergency_requests_set_updated_at
before update on public.emergency_requests
for each row execute function public.set_updated_at();

create index if not exists emergency_requests_hospital_idx
on public.emergency_requests(hospital_id, created_at desc);
create index if not exists emergency_requests_center_idx
on public.emergency_requests(center_id, created_at desc);

-- =========================================================
-- donor_slots (virtual queue)
-- =========================================================
create table if not exists public.donor_slots (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  center_id uuid not null references public.profiles(id) on delete cascade,
  slot_time timestamptz not null,
  status public.slot_status not null default 'booked',
  eta_demo_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists donor_slots_set_updated_at on public.donor_slots;
create trigger donor_slots_set_updated_at
before update on public.donor_slots
for each row execute function public.set_updated_at();

create index if not exists donor_slots_donor_time_idx
on public.donor_slots(donor_id, slot_time desc);

-- =========================================================
-- notifications
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
on public.notifications(user_id, read, created_at desc);

-- =========================================================
-- RLS Policies
-- =========================================================
alter table public.profiles enable row level security;
alter table public.donor_health_events enable row level security;
alter table public.donor_donations enable row level security;
alter table public.blood_inventory enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.donor_slots enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- leaderboard uchun donor profilni blood_center/hospital ko‘rsin
drop policy if exists profiles_select_donors_for_center on public.profiles;
create policy profiles_select_donors_for_center
on public.profiles for select
to authenticated
using (
  role = 'donor'
  and public.current_role() in ('hospital'::public.user_role, 'blood_center'::public.user_role)
);

-- donor_health_events
drop policy if exists donor_health_events_select on public.donor_health_events;
create policy donor_health_events_select
on public.donor_health_events for select
to authenticated
using (donor_id = auth.uid() or public.current_role() in ('hospital'::public.user_role, 'blood_center'::public.user_role));

drop policy if exists donor_health_events_insert on public.donor_health_events;
create policy donor_health_events_insert
on public.donor_health_events for insert
to authenticated
with check (donor_id = auth.uid() and public.current_role() = 'donor'::public.user_role);

-- blood_inventory
drop policy if exists blood_inventory_select on public.blood_inventory;
create policy blood_inventory_select
on public.blood_inventory for select
to authenticated
using (
  (public.current_role() = 'hospital'::public.user_role and hospital_id = auth.uid())
  or
  (public.current_role() = 'blood_center'::public.user_role and center_id = auth.uid())
);

drop policy if exists blood_inventory_write on public.blood_inventory;
create policy blood_inventory_write
on public.blood_inventory for all
to authenticated
using (
  (public.current_role() = 'hospital'::public.user_role and hospital_id = auth.uid())
  or
  (public.current_role() = 'blood_center'::public.user_role and center_id = auth.uid())
)
with check (
  (public.current_role() = 'hospital'::public.user_role and hospital_id = auth.uid())
  or
  (public.current_role() = 'blood_center'::public.user_role and center_id = auth.uid())
);

-- emergency_requests
drop policy if exists emergency_select_policy on public.emergency_requests;
create policy emergency_select_policy
on public.emergency_requests for select
to authenticated
using (
  -- donor o‘ziniki
  donor_id = auth.uid()
  or
  -- hospital
  (public.current_role() = 'hospital'::public.user_role and hospital_id = auth.uid())
  or
  -- blood center: claim qiladiganlari ham (center_id null bo‘lsa ham) ko‘rinadi
  (public.current_role() = 'blood_center'::public.user_role and (center_id = auth.uid() or center_id is null))
);

drop policy if exists emergency_insert_hospital on public.emergency_requests;
create policy emergency_insert_hospital
on public.emergency_requests for insert
to authenticated
with check (
  public.current_role() = 'hospital'::public.user_role
  and hospital_id = auth.uid()
);

drop policy if exists emergency_insert_donor on public.emergency_requests;
create policy emergency_insert_donor
on public.emergency_requests for insert
to authenticated
with check (
  public.current_role() = 'donor'::public.user_role
  and donor_id = auth.uid()
);

drop policy if exists emergency_update_blood_center_claim on public.emergency_requests;
create policy emergency_update_blood_center_claim
on public.emergency_requests for update
to authenticated
using (
  public.current_role() = 'blood_center'::public.user_role
  and (center_id = auth.uid() or center_id is null)
)
with check (
  public.current_role() = 'blood_center'::public.user_role
  and center_id = auth.uid()
);

drop policy if exists emergency_update_donor on public.emergency_requests;
create policy emergency_update_donor
on public.emergency_requests for update
to authenticated
using (
  public.current_role() = 'donor'::public.user_role
  and donor_id = auth.uid()
)
with check (
  public.current_role() = 'donor'::public.user_role
  and donor_id = auth.uid()
);

-- donor_slots
drop policy if exists donor_slots_select on public.donor_slots;
create policy donor_slots_select
on public.donor_slots for select
to authenticated
using (
  donor_id = auth.uid()
  or
  (public.current_role() = 'blood_center'::public.user_role and center_id = auth.uid())
);

drop policy if exists donor_slots_insert on public.donor_slots;
create policy donor_slots_insert
on public.donor_slots for insert
to authenticated
with check (
  donor_id = auth.uid()
  and public.current_role() = 'donor'::public.user_role
);

drop policy if exists donor_slots_update on public.donor_slots;
create policy donor_slots_update
on public.donor_slots for update
to authenticated
using (
  (public.current_role() = 'donor'::public.user_role and donor_id = auth.uid())
  or
  (public.current_role() = 'blood_center'::public.user_role and center_id = auth.uid())
)
with check (
  (public.current_role() = 'donor'::public.user_role and donor_id = auth.uid())
  or
  (public.current_role() = 'blood_center'::public.user_role and center_id = auth.uid())
);

-- notifications
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =========================================================
-- Realtime replica identity (change feeds uchun)
-- =========================================================
alter table public.blood_inventory replica identity full;
alter table public.emergency_requests replica identity full;
alter table public.donor_slots replica identity full;
alter table public.notifications replica identity full;

