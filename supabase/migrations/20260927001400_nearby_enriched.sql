-- ParkQuest — 1400 : « Autour de vous » enrichi.
-- nearby_spots renvoie désormais tout ce qu'il faut pour la carte ET la liste,
-- et nearby_facilities couvre les services (toilettes, café, parking PMR…).
-- Les coordonnées reçues ne sont jamais stockées ; RLS appliquée (SECURITY INVOKER).

drop function if exists public.nearby_spots(uuid, double precision, double precision, integer, text);

create or replace function public.nearby_spots(
  p_park_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_m integer default 500,
  p_locale text default 'en',
  p_limit integer default 30
)
returns table (
  spot_id uuid,
  slug text,
  kind public.spot_kind,
  name text,
  label text,
  categories text[],
  latitude double precision,
  longitude double precision,
  distance_m integer,
  cover_image_url text,
  is_pmr_accessible boolean,
  points_value integer,
  status public.content_status
)
language sql
stable
set search_path = ''
as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography as g
  )
  select
    s.id,
    s.slug::text,
    s.kind,
    tr.name,
    tr.label,
    coalesce((select array_agg(c.key::text order by c.sort_order)
              from public.spot_category_relations r join public.spot_categories c on c.id = r.category_id
              where r.spot_id = s.id), '{}'),
    s.latitude,
    s.longitude,
    round(extensions.st_distance(s.location, o.g))::int,
    s.cover_image_url,
    s.is_pmr_accessible,
    s.points_value,
    s.status
  from public.spots s
  join public.parks p on p.id = s.park_id
  cross join origin o
  left join lateral (
    select t.name, t.label from public.spot_translations t
    where t.spot_id = s.id
    order by case when t.locale = p_locale then 0 when t.locale = 'en' then 1 when t.locale = p.default_locale then 2 else 3 end
    limit 1
  ) tr on true
  where s.park_id = p_park_id
    and s.status = 'PUBLISHED'
    and p_latitude between -90 and 90
    and p_longitude between -180 and 180
    and extensions.st_dwithin(s.location, o.g, least(greatest(coalesce(p_radius_m, 500), 1), 5000))
  order by extensions.st_distance(s.location, o.g)
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

create or replace function public.nearby_facilities(
  p_park_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_m integer default 500,
  p_locale text default 'en',
  p_limit integer default 30
)
returns table (
  facility_id uuid,
  type public.facility_type,
  name text,
  latitude double precision,
  longitude double precision,
  distance_m integer,
  is_pmr_accessible boolean
)
language sql
stable
set search_path = ''
as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography as g
  )
  select
    f.id, f.type, tr.name, f.latitude, f.longitude,
    round(extensions.st_distance(f.location, o.g))::int,
    f.is_pmr_accessible
  from public.facilities f
  join public.parks p on p.id = f.park_id
  cross join origin o
  left join lateral (
    select t.name from public.facility_translations t
    where t.facility_id = f.id
    order by case when t.locale = p_locale then 0 when t.locale = 'en' then 1 when t.locale = p.default_locale then 2 else 3 end
    limit 1
  ) tr on true
  where f.park_id = p_park_id
    and f.status = 'PUBLISHED'
    and extensions.st_dwithin(f.location, o.g, least(greatest(coalesce(p_radius_m, 500), 1), 5000))
  order by extensions.st_distance(f.location, o.g)
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

grant execute on function public.nearby_spots(uuid, double precision, double precision, integer, text, integer) to anon, authenticated;
grant execute on function public.nearby_facilities(uuid, double precision, double precision, integer, text, integer) to anon, authenticated;
