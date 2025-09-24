-- Migration: Initial schema for Salon Excellence
set check_function_bodies = off;

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

create type public.role as enum ('ADMIN', 'STAFF', 'CUSTOMER');
create type public.appointment_status as enum ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
create type public.payment_status as enum ('UNPAID', 'PAID', 'REFUNDED', 'PARTIAL');
create type public.cms_status as enum ('draft', 'published');

create or replace function public.current_profile_role()
returns public.role
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.has_role(target_role public.role)
returns boolean
language sql
stable
security definer
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'CUSTOMER') = target_role;
$$;

create or replace function public.is_staff_in_location(target_location uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.staff s
    where s.id = auth.uid() and s.location_id = target_location
  );
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.role not null default 'CUSTOMER',
  full_name text,
  phone text,
  locale text not null default 'de-CH',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  canton text not null,
  street text,
  postal_code text,
  city text,
  timezone text not null default 'Europe/Zurich',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0),
  price_chf integer not null check (price_chf >= 0),
  currency char(3) not null default 'CHF',
  cms_status public.cms_status not null default 'draft',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  name text not null,
  capacity integer not null default 1 check (capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_resources (
  service_id uuid not null references public.services (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  primary key (service_id, resource_id)
);

create table public.staff (
  id uuid primary key references public.profiles (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_url text,
  calendar_color text default '#6d28d9',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_services (
  staff_id uuid not null references public.staff (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  duration_minutes integer,
  buffer_before_minutes integer,
  buffer_after_minutes integer,
  price_chf integer,
  primary key (staff_id, service_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  email text not null,
  phone text,
  preferred_name text,
  notes text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  weekday smallint not null check (weekday >= 0 and weekday <= 6),
  start_time time not null,
  end_time time not null,
  capacity_override integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_blocks_time_check check (end_time > start_time)
);

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_off_end_after_start check (end_at > start_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  staff_id uuid not null references public.staff (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  appointment_range tstzrange generated always as (tstzrange(start_at, end_at, '[]')) stored,
  status public.appointment_status not null default 'PENDING',
  payment_status public.payment_status not null default 'UNPAID',
  total_amount_chf integer not null check (total_amount_chf >= 0),
  currency char(3) not null default 'CHF',
  stripe_checkout_id text,
  stripe_payment_intent_id text,
  sumup_checkout_id text,
  notes text,
  cancellation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_end_after_start check (end_at > start_at)
);

create index appointments_staff_range_idx on public.appointments using gist (staff_id, appointment_range);

alter table public.appointments
  add constraint appointments_exclude_overlap
  exclude using gist (
    staff_id with =,
    appointment_range with &&
  ) where (status in ('PENDING', 'CONFIRMED'));

create table public.appointment_resources (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  primary key (appointment_id, resource_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  subtotal_chf integer not null check (subtotal_chf >= 0),
  tax_chf integer not null default 0,
  total_chf integer not null check (total_chf >= 0),
  status public.payment_status not null default 'UNPAID',
  stripe_invoice_id text,
  sumup_receipt_id text,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table public.cms_blocks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  body jsonb not null default '{}'::jsonb,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  locale text not null default 'de-CH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigserial primary key,
  profile_id uuid references public.profiles (id) on delete set null,
  event_name text not null,
  event_properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.webhook_logs (
  id bigserial primary key,
  provider text not null,
  event_id text not null,
  event_type text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles_updated
before update on public.profiles
for each row
execute procedure public.touch_updated_at();

create trigger touch_locations_updated
before update on public.locations
for each row
execute procedure public.touch_updated_at();

create trigger touch_services_updated
before update on public.services
for each row
execute procedure public.touch_updated_at();

create trigger touch_staff_updated
before update on public.staff
for each row
execute procedure public.touch_updated_at();

create trigger touch_customers_updated
before update on public.customers
for each row
execute procedure public.touch_updated_at();

create trigger touch_availability_blocks_updated
before update on public.availability_blocks
for each row
execute procedure public.touch_updated_at();

create trigger touch_time_off_updated
before update on public.time_off
for each row
execute procedure public.touch_updated_at();

create trigger touch_appointments_updated
before update on public.appointments
for each row
execute procedure public.touch_updated_at();

create trigger touch_cms_blocks_updated
before update on public.cms_blocks
for each row
execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.services enable row level security;
alter table public.resources enable row level security;
alter table public.service_resources enable row level security;
alter table public.staff enable row level security;
alter table public.staff_services enable row level security;
alter table public.customers enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.time_off enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_resources enable row level security;
alter table public.invoices enable row level security;
alter table public.cms_blocks enable row level security;
alter table public.analytics_events enable row level security;
alter table public.webhook_logs enable row level security;

create policy "profiles self access" on public.profiles
for select using (auth.uid() = id or public.has_role('ADMIN'));

create policy "profiles self manage" on public.profiles
for update using (auth.uid() = id or public.has_role('ADMIN'));

create policy "locations admin access" on public.locations
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "services public read" on public.services
for select using (cms_status = 'published' and is_active);

create policy "services admin manage" on public.services
for all using (public.has_role('ADMIN')) with check (true);

create policy "resources admin manage" on public.resources
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "service_resources admin manage" on public.service_resources
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "staff self and admin select" on public.staff
for select using (auth.uid() = id or public.has_role('ADMIN'));

create policy "staff admin manage" on public.staff
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "staff services admin manage" on public.staff_services
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "customers self select" on public.customers
for select using (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.id = customers.profile_id
  )
);

create policy "customers self manage" on public.customers
for all using (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.id = customers.profile_id
  )
) with check (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.id = customers.profile_id
  )
);

create policy "availability staff read" on public.availability_blocks
for select using (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.staff s
    where s.id = auth.uid() and s.id = availability_blocks.staff_id
  )
);

create policy "availability admin manage" on public.availability_blocks
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "time off staff read" on public.time_off
for select using (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.staff s
    where s.id = auth.uid() and s.id = time_off.staff_id
  )
);

create policy "time off admin manage" on public.time_off
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "appointments customer view" on public.appointments
for select using (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.customers c
    where c.id = appointments.customer_id
      and c.profile_id = auth.uid()
  )
  or auth.uid() = appointments.staff_id
);

create policy "appointments staff manage" on public.appointments
for update using (
  public.has_role('ADMIN')
  or auth.uid() = appointments.staff_id
) with check (
  public.has_role('ADMIN')
  or auth.uid() = appointments.staff_id
);

create policy "appointments admin insert" on public.appointments
for insert with check (public.has_role('ADMIN'));

create policy "appointment resources staff view" on public.appointment_resources
for select using (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.appointments a
    where a.id = appointment_resources.appointment_id
      and (auth.uid() = a.staff_id or exists (
        select 1 from public.customers c
        where c.id = a.customer_id and c.profile_id = auth.uid()
      ))
  )
);

create policy "appointment resources admin manage" on public.appointment_resources
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "invoices related access" on public.invoices
for select using (
  public.has_role('ADMIN')
  or exists (
    select 1 from public.appointments a
    join public.customers c on c.id = a.customer_id
    where a.id = invoices.appointment_id
      and (auth.uid() = a.staff_id or c.profile_id = auth.uid())
  )
);

create policy "invoices admin manage" on public.invoices
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "cms blocks public read" on public.cms_blocks
for select using (status = 'published');

create policy "cms blocks admin manage" on public.cms_blocks
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

create policy "analytics events owner" on public.analytics_events
for select using (public.has_role('ADMIN') or auth.uid() = profile_id);

create policy "analytics events admin insert" on public.analytics_events
for insert with check (public.has_role('ADMIN'));

create policy "webhook logs admin" on public.webhook_logs
for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

comment on table public.services is 'Service catalogue with duration, buffers and pricing in CHF.';
comment on table public.availability_blocks is 'Weekly recurring availability windows per staff member.';
comment on constraint appointments_exclude_overlap on public.appointments is 'Prevents staff double bookings by excluding overlapping ranges when status is pending or confirmed.';

