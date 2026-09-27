-- ParkQuest — 0100 : extensions, types énumérés, utilitaires communs.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------

create type public.app_role as enum (
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'PARK_ADMIN',
  'EDITOR',
  'MODERATOR',
  'USER'
);

create type public.content_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');

create type public.moderation_status as enum ('PENDING', 'APPROVED', 'REJECTED');

create type public.park_type as enum (
  'BOTANICAL_GARDEN',
  'ARBORETUM',
  'URBAN_PARK',
  'HISTORIC_PARK',
  'NATURAL_PARK'
);

create type public.spot_kind as enum (
  'TREE',
  'PLANT',
  'FLOWER',
  'GARDEN',
  'HISTORIC',
  'BUILDING',
  'STATUE',
  'VIEWPOINT',
  'WATER',
  'OTHER'
);

create type public.facility_type as enum (
  'ENTRANCE',
  'PARKING',
  'PARKING_PMR',
  'BIKE_PARKING',
  'TOILETS',
  'TOILETS_PMR',
  'CAFE',
  'BENCH',
  'WATER',
  'VIEWPOINT',
  'PLAYGROUND',
  'INFO_POINT',
  'PUBLIC_TRANSPORT'
);

create type public.trail_difficulty as enum ('EASY', 'MEDIUM', 'HARD');

create type public.challenge_type as enum ('PHOTO', 'OBSERVATION', 'WALK', 'QUIZ_STREAK');

create type public.visit_status as enum ('IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- Mode de validation d'une découverte de spot.
create type public.discovery_method as enum (
  'GPS_VERIFIED',   -- distance et précision GPS vérifiées côté serveur
  'SELF_DECLARED'   -- mode sans GPS / précision insuffisante : confirmé par l'utilisateur
);

create type public.point_reason as enum (
  'SPOT_DISCOVERED',
  'QUIZ_PASSED',
  'CHALLENGE_COMPLETED',
  'TRAIL_COMPLETED',
  'PHOTO_APPROVED',
  'ADMIN_ADJUSTMENT'
);

create type public.badge_criteria as enum (
  'SPOTS_DISCOVERED',
  'QUIZZES_PASSED',
  'PHOTOS_APPROVED',
  'DISTANCE_M',
  'TRAILS_COMPLETED',
  'CHALLENGES_COMPLETED'
);

create type public.media_kind as enum ('IMAGE', 'VIDEO');

create type public.favorite_target as enum ('PARK', 'SPOT', 'TRAIL', 'ARTICLE');

-- ---------------------------------------------------------------------------
-- Domaines
-- ---------------------------------------------------------------------------

-- Code langue BCP-47 simplifié : "fr", "nl", "en", "pt-BR"…
create domain public.locale_code as text
  check (value ~ '^[a-z]{2}(-[A-Z]{2})?$');

create domain public.slug as text
  check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(value) <= 120);

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
