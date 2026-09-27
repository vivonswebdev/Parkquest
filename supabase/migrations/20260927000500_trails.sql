-- ParkQuest — 0500 : parcours, étapes et segments.

create table public.trails (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  slug public.slug not null,
  status public.content_status not null default 'DRAFT',
  is_demo_data boolean not null default true,
  difficulty public.trail_difficulty not null default 'EASY',
  duration_min int not null check (duration_min > 0),
  distance_m int not null check (distance_m > 0),
  -- ex. {'FAMILY','KIDS','CURIOUS'}
  audiences text[] not null default '{}',
  -- ex. {'TREES','ESSENTIALS','PHOTO','CALM','PMR','HISTORY','FLOWERS'}
  themes text[] not null default '{}',
  is_pmr_accessible boolean,
  pmr_partial boolean not null default false,
  cover_image_url text,
  completion_points int not null default 20 check (completion_points between 0 and 500),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (park_id, slug)
);

create index trails_park_status_idx on public.trails (park_id, status);

create trigger trails_updated_at before update on public.trails
  for each row execute function public.set_updated_at();

create table public.trail_translations (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails (id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  summary text,
  description text,
  accessibility_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trail_id, locale)
);

create trigger trail_translations_updated_at before update on public.trail_translations
  for each row execute function public.set_updated_at();

create table public.trail_spots (
  trail_id uuid not null references public.trails (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  position int not null check (position > 0),
  created_at timestamptz not null default now(),
  primary key (trail_id, spot_id),
  unique (trail_id, position) deferrable initially deferred
);

create index trail_spots_spot_idx on public.trail_spots (spot_id);

-- Segment entre deux étapes consécutives (from NULL = depuis l'entrée du parcours).
create table public.trail_segments (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails (id) on delete cascade,
  from_spot_id uuid references public.spots (id) on delete set null,
  to_spot_id uuid not null references public.spots (id) on delete cascade,
  position int not null check (position > 0),
  geometry extensions.geography(LineString, 4326) not null,
  distance_m int generated always as (round(extensions.st_length(geometry))::int) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trail_id, position)
);

create index trail_segments_geom_gix on public.trail_segments using gist (geometry);

create trigger trail_segments_updated_at before update on public.trail_segments
  for each row execute function public.set_updated_at();

create table public.trail_segment_translations (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references public.trail_segments (id) on delete cascade,
  locale public.locale_code not null,
  instruction text not null,   -- « Continuez tout droit, puis tournez à droite après la fontaine. »
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (segment_id, locale)
);

create trigger trail_segment_translations_updated_at before update on public.trail_segment_translations
  for each row execute function public.set_updated_at();
