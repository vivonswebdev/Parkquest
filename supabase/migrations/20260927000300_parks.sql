-- ParkQuest — 0300 : parcs, traductions, informations pratiques.

create table public.parks (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  type public.park_type not null,
  status public.content_status not null default 'DRAFT',
  -- Toute donnée non validée par le parc doit rester marquée comme démo.
  is_demo_data boolean not null default true,
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  city text not null,
  timezone text not null default 'Europe/Brussels',
  default_locale public.locale_code not null default 'en',
  available_locales public.locale_code[] not null default array['en']::public.locale_code[],
  location extensions.geography(Point, 4326) not null,
  boundary extensions.geography(Polygon, 4326),
  default_zoom numeric(4, 2) not null default 15,
  -- Identité visuelle propre au parc (couleur d'accent, logo…).
  brand_color text check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url text,
  cover_image_url text,
  is_free boolean,
  is_pmr_friendly boolean,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index parks_location_gix on public.parks using gist (location);
create index parks_status_idx on public.parks (status);
create index parks_country_idx on public.parks (country_code);

create trigger parks_updated_at before update on public.parks
  for each row execute function public.set_updated_at();

alter table public.user_roles
  add constraint user_roles_park_fk
  foreign key (park_id) references public.parks (id) on delete cascade;

create table public.park_translations (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  tagline text,
  description text,
  practical_notes text,
  accessibility_notes text,
  transport_notes text,
  rules text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (park_id, locale)
);

create trigger park_translations_updated_at before update on public.park_translations
  for each row execute function public.set_updated_at();

-- Données pratiques structurées (non linguistiques). Le texte est dans park_translations.
create table public.park_practical_info (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null unique references public.parks (id) on delete cascade,
  address_line text,
  postal_code text,
  website_url text,
  ticket_url text,
  phone text,
  -- ex. [{"days":[1,2,3,4,5,6,7],"open":"09:30","close":"17:00","season":"winter"}]
  opening_hours jsonb not null default '[]'::jsonb,
  -- ex. [{"label_key":"adult","amount":8,"currency":"EUR"}]
  prices jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger park_practical_info_updated_at before update on public.park_practical_info
  for each row execute function public.set_updated_at();
