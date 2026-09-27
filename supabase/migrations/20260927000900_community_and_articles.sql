-- ParkQuest — 0900 : médias, commentaires, signalements, favoris, articles.

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,  -- NULL = média officiel du parc
  park_id uuid not null references public.parks (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete set null,
  kind public.media_kind not null default 'IMAGE',
  storage_path text not null,
  width int,
  height int,
  alt_text text,
  -- Photo utilisateur : PENDING avant toute publication.
  moderation_status public.moderation_status not null default 'PENDING',
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_park_status_idx on public.media (park_id, moderation_status);
create index media_spot_idx on public.media (spot_id);
create index media_owner_idx on public.media (owner_id);

create trigger media_updated_at before update on public.media
  for each row execute function public.set_updated_at();

alter table public.challenge_completions
  add constraint challenge_completions_media_fk foreign key (media_id) references public.media (id) on delete set null;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  park_id uuid not null references public.parks (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete cascade,
  trail_id uuid references public.trails (id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  locale public.locale_code,
  moderation_status public.moderation_status not null default 'PENDING',
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_spot_idx on public.comments (spot_id, moderation_status);
create index comments_park_idx on public.comments (park_id, moderation_status);

create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

create table public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (length(reason) between 1 and 500),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create trigger comment_reports_updated_at before update on public.comment_reports
  for each row execute function public.set_updated_at();

create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_type public.favorite_target not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create trigger user_favorites_updated_at before update on public.user_favorites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Articles / blog / conseils
-- ---------------------------------------------------------------------------

create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  key public.slug not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger article_categories_updated_at before update on public.article_categories
  for each row execute function public.set_updated_at();

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  park_id uuid references public.parks (id) on delete cascade,  -- NULL = article plateforme
  category_id uuid references public.article_categories (id) on delete set null,
  slug public.slug not null,
  status public.content_status not null default 'DRAFT',
  is_demo_data boolean not null default true,
  cover_image_url text,
  reading_minutes int not null default 5,
  published_at timestamptz,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_slug_unique unique nulls not distinct (park_id, slug)
);

create index articles_status_idx on public.articles (status, published_at desc);

create trigger articles_updated_at before update on public.articles
  for each row execute function public.set_updated_at();

create table public.article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  locale public.locale_code not null,
  title text not null,
  excerpt text,
  body_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, locale)
);

create trigger article_translations_updated_at before update on public.article_translations
  for each row execute function public.set_updated_at();
