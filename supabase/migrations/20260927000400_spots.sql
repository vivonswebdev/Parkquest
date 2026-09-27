-- ParkQuest — 0400 : catégories et spots (arbres, plantes, lieux…).

create table public.spot_categories (
  id uuid primary key default gen_random_uuid(),
  -- NULL = catégorie globale plateforme ; sinon catégorie propre à un parc.
  park_id uuid references public.parks (id) on delete cascade,
  key public.slug not null,
  icon text not null default 'map-pin',
  color text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spot_categories_key_unique unique nulls not distinct (park_id, key)
);

create trigger spot_categories_updated_at before update on public.spot_categories
  for each row execute function public.set_updated_at();

create table public.spot_category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.spot_categories (id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, locale)
);

create trigger spot_category_translations_updated_at before update on public.spot_category_translations
  for each row execute function public.set_updated_at();

create table public.spots (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  slug public.slug not null,
  kind public.spot_kind not null,
  status public.content_status not null default 'DRAFT',
  is_demo_data boolean not null default true,
  location extensions.geography(Point, 4326) not null,
  -- Rayon (m) dans lequel une découverte peut être vérifiée par GPS.
  discovery_radius_m int not null default 35 check (discovery_radius_m between 5 and 500),
  scientific_name text,
  -- Faits structurés : {"origin_key":"north_america","planted_year":1923,"height_m":38,"girth_m":7.2}
  facts jsonb not null default '{}'::jsonb,
  cover_image_url text,
  is_pmr_accessible boolean,
  points_value int not null default 10 check (points_value between 0 and 100),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (park_id, slug)
);

create index spots_location_gix on public.spots using gist (location);
create index spots_park_status_idx on public.spots (park_id, status);

create trigger spots_updated_at before update on public.spots
  for each row execute function public.set_updated_at();

create table public.spot_translations (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  label text,             -- ex. « Arbre remarquable »
  summary text,
  about text,
  fun_fact text,          -- « Le saviez-vous ? »
  directions text,        -- « Comment y aller ? »
  origin text,            -- libellé localisé de l'origine
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (spot_id, locale)
);

create trigger spot_translations_updated_at before update on public.spot_translations
  for each row execute function public.set_updated_at();

create table public.spot_category_relations (
  spot_id uuid not null references public.spots (id) on delete cascade,
  category_id uuid not null references public.spot_categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, category_id)
);

create index spot_category_relations_category_idx on public.spot_category_relations (category_id);
