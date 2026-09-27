-- ParkQuest — 1300 : colonnes calculées pour l'API (PostgREST renvoie les
-- géographies en WKB). Lecture seule, dérivées de la géométrie source.

alter table public.parks
  add column latitude double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column longitude double precision generated always as (extensions.st_x(location::extensions.geometry)) stored,
  add column bounds_geojson jsonb generated always as ((extensions.st_asgeojson(boundary))::jsonb) stored;

alter table public.spots
  add column latitude double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column longitude double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;

alter table public.facilities
  add column latitude double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column longitude double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;

alter table public.trail_segments
  add column path_geojson jsonb generated always as ((extensions.st_asgeojson(geometry))::jsonb) stored;
