-- ParkQuest — 0600 : services du parc (toilettes, parkings, cafés…).

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  type public.facility_type not null,
  status public.content_status not null default 'DRAFT',
  is_demo_data boolean not null default true,
  location extensions.geography(Point, 4326) not null,
  is_pmr_accessible boolean,
  -- ex. {"capacity":1200,"free":true}
  details jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index facilities_location_gix on public.facilities using gist (location);
create index facilities_park_type_idx on public.facilities (park_id, type);

create trigger facilities_updated_at before update on public.facilities
  for each row execute function public.set_updated_at();

create table public.facility_translations (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, locale)
);

create trigger facility_translations_updated_at before update on public.facility_translations
  for each row execute function public.set_updated_at();
