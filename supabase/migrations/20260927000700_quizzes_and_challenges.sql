-- ParkQuest — 0700 : quiz et défis.

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete cascade,
  status public.content_status not null default 'DRAFT',
  is_demo_data boolean not null default true,
  points_value int not null default 10 check (points_value between 0 and 100),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quizzes_park_idx on public.quizzes (park_id);
create index quizzes_spot_idx on public.quizzes (spot_id);

create trigger quizzes_updated_at before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.quiz_translations (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  locale public.locale_code not null,
  question text not null,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, locale)
);

create trigger quiz_translations_updated_at before update on public.quiz_translations
  for each row execute function public.set_updated_at();

-- is_correct n'est JAMAIS lisible directement par le client (voir RLS / vue quiz_answers_public).
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  is_correct boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quiz_answers_quiz_idx on public.quiz_answers (quiz_id);
create unique index quiz_answers_one_correct on public.quiz_answers (quiz_id) where is_correct;

create trigger quiz_answers_updated_at before update on public.quiz_answers
  for each row execute function public.set_updated_at();

create table public.quiz_answer_translations (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.quiz_answers (id) on delete cascade,
  locale public.locale_code not null,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (answer_id, locale)
);

create trigger quiz_answer_translations_updated_at before update on public.quiz_answer_translations
  for each row execute function public.set_updated_at();

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  answer_id uuid not null references public.quiz_answers (id) on delete cascade,
  visit_id uuid,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quiz_attempts_user_idx on public.quiz_attempts (user_id, quiz_id);

create trigger quiz_attempts_updated_at before update on public.quiz_attempts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Défis
-- ---------------------------------------------------------------------------

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete cascade,
  type public.challenge_type not null,
  status public.content_status not null default 'DRAFT',
  is_demo_data boolean not null default true,
  -- Un défi photo passe par la modération avant l'attribution des points.
  requires_photo boolean not null default false,
  points_value int not null default 20 check (points_value between 0 and 200),
  -- Objectif chiffré pour les défis cumulatifs (ex. WALK = 1000 m).
  target_value int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index challenges_park_idx on public.challenges (park_id);
create index challenges_spot_idx on public.challenges (spot_id);

create trigger challenges_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

create table public.challenge_translations (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  locale public.locale_code not null,
  title text not null,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, locale)
);

create trigger challenge_translations_updated_at before update on public.challenge_translations
  for each row execute function public.set_updated_at();

create table public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  visit_id uuid,
  media_id uuid,
  status public.moderation_status not null default 'PENDING',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create trigger challenge_completions_updated_at before update on public.challenge_completions
  for each row execute function public.set_updated_at();
