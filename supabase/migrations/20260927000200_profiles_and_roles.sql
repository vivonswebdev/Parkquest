-- ParkQuest — 0200 : profils, rôles et fonctions d'autorisation.

-- ---------------------------------------------------------------------------
-- Profils (1-1 avec auth.users). Pseudonyme par défaut, jamais de position.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[A-Za-z0-9_.-]{3,32}$'),
  display_name text check (length(display_name) <= 60),
  avatar_url text,
  preferred_locale public.locale_code not null default 'fr',
  -- Préparé pour les fonctions « mineurs » (consentement parental, plus tard).
  is_minor boolean not null default false,
  parental_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Rôles. park_id NULL = rôle plateforme (SUPER_ADMIN, PLATFORM_ADMIN, USER).
-- park_id renseigné = rôle limité à un parc (PARK_ADMIN, EDITOR, MODERATOR).
-- La FK vers parks est ajoutée dans la migration des parcs.
-- ---------------------------------------------------------------------------

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  park_id uuid,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_roles_scope_check check (
    (role in ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'USER') and park_id is null)
    or (role in ('PARK_ADMIN', 'EDITOR', 'MODERATOR') and park_id is not null)
  ),
  constraint user_roles_unique unique nulls not distinct (user_id, role, park_id)
);

create index user_roles_user_idx on public.user_roles (user_id);
create index user_roles_park_idx on public.user_roles (park_id) where park_id is not null;

create trigger user_roles_updated_at before update on public.user_roles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Fonctions d'autorisation (SECURITY DEFINER pour éviter la récursion RLS).
-- ---------------------------------------------------------------------------

create or replace function public.has_platform_role(p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.park_id is null
      and ur.role = any (p_roles)
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_platform_role(array['SUPER_ADMIN']::public.app_role[]);
$$;

create or replace function public.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_platform_role(array['SUPER_ADMIN', 'PLATFORM_ADMIN']::public.app_role[]);
$$;

-- Vrai si l'utilisateur a l'un des rôles donnés SUR CE PARC, ou est staff plateforme.
create or replace function public.has_park_role(p_park_id uuid, p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_staff() or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.park_id = p_park_id
      and ur.role = any (p_roles)
  );
$$;

create or replace function public.can_admin_park(p_park_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select public.has_park_role(p_park_id, array['PARK_ADMIN']::public.app_role[]); $$;

create or replace function public.can_edit_park(p_park_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select public.has_park_role(p_park_id, array['PARK_ADMIN', 'EDITOR']::public.app_role[]); $$;

create or replace function public.can_moderate_park(p_park_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select public.has_park_role(p_park_id, array['PARK_ADMIN', 'MODERATOR']::public.app_role[]); $$;

-- ---------------------------------------------------------------------------
-- Création automatique du profil + rôle USER à l'inscription.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_try int := 0;
begin
  -- Pseudonyme par défaut : jamais l'e-mail ni le vrai nom. Unicité garantie par boucle.
  loop
    v_username := 'explorer' || substr(md5(new.id::text || v_try::text), 1, 8);
    exit when not exists (select 1 from public.profiles where username = v_username);
    v_try := v_try + 1;
  end loop;

  insert into public.profiles (id, username, preferred_locale)
  values (
    new.id,
    v_username,
    coalesce(
      case when (new.raw_user_meta_data ->> 'locale') ~ '^[a-z]{2}(-[A-Z]{2})?$'
        then new.raw_user_meta_data ->> 'locale' end,
      'fr'
    )
  );

  insert into public.user_roles (user_id, role) values (new.id, 'USER');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
