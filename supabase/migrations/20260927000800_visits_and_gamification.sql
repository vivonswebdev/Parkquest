-- ParkQuest — 0800 : visites, découvertes, points, badges.

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  park_id uuid not null references public.parks (id) on delete cascade,
  trail_id uuid references public.trails (id) on delete set null,
  status public.visit_status not null default 'IN_PROGRESS',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  -- Distance cumulée déclarée par l'appareil (statistique personnelle, bornée).
  distance_m int not null default 0 check (distance_m between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visits_user_idx on public.visits (user_id, started_at desc);
create index visits_park_idx on public.visits (park_id);
-- Une seule visite active par utilisateur et par parc.
create unique index visits_one_active on public.visits (user_id, park_id)
  where status in ('IN_PROGRESS', 'PAUSED');

create trigger visits_updated_at before update on public.visits
  for each row execute function public.set_updated_at();

alter table public.quiz_attempts
  add constraint quiz_attempts_visit_fk foreign key (visit_id) references public.visits (id) on delete set null;
alter table public.challenge_completions
  add constraint challenge_completions_visit_fk foreign key (visit_id) references public.visits (id) on delete set null;

-- Découverte d'un spot. AUCUNE coordonnée brute n'est stockée :
-- uniquement la distance calculée et la précision annoncée.
create table public.visit_spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  visit_id uuid references public.visits (id) on delete set null,
  method public.discovery_method not null,
  distance_m int,
  accuracy_m int,
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un spot n'est « découvert » qu'une fois par utilisateur (collection).
  unique (user_id, spot_id)
);

create index visit_spots_visit_idx on public.visit_spots (visit_id);

create trigger visit_spots_updated_at before update on public.visit_spots
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Points : journal immuable. Jamais de colonne total_points modifiable.
-- ---------------------------------------------------------------------------

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  park_id uuid references public.parks (id) on delete set null,
  amount int not null check (amount <> 0 and amount between -1000 and 1000),
  reason public.point_reason not null,
  -- Référence de la source (spot, quiz, défi, parcours, média).
  source_id uuid,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index point_transactions_user_idx on public.point_transactions (user_id, created_at desc);
-- Idempotence : une même source ne rapporte des points qu'une fois (hors ajustements admin).
create unique index point_transactions_once
  on public.point_transactions (user_id, reason, source_id)
  where reason <> 'ADMIN_ADJUSTMENT' and source_id is not null;

create trigger point_transactions_updated_at before update on public.point_transactions
  for each row execute function public.set_updated_at();

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  -- NULL = badge global plateforme.
  park_id uuid references public.parks (id) on delete cascade,
  key public.slug not null,
  icon text not null default 'award',
  criteria public.badge_criteria not null,
  threshold int not null check (threshold > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint badges_key_unique unique nulls not distinct (park_id, key)
);

create trigger badges_updated_at before update on public.badges
  for each row execute function public.set_updated_at();

create table public.badge_translations (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references public.badges (id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (badge_id, locale)
);

create trigger badge_translations_updated_at before update on public.badge_translations
  for each row execute function public.set_updated_at();

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create trigger user_badges_updated_at before update on public.user_badges
  for each row execute function public.set_updated_at();
