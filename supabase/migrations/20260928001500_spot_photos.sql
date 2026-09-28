-- ParkQuest — 1500 : photos de spots (communauté, officielles, Wikimedia Commons).
--
-- Principe « comme les fiches d'un lieu sur une carte » : chacun peut proposer une photo d'un
-- spot ; elle reste PENDING (invisible du public) jusqu'à validation par un modérateur du parc.
-- Une fois approuvée, le serveur la publie (copie nettoyée dans park-media) et renseigne public_url.

create type public.media_source as enum ('COMMUNITY', 'OFFICIAL', 'WIKIMEDIA');

alter table public.media
  add column source public.media_source not null default 'COMMUNITY',
  add column license text,           -- ex. « CC BY-SA 4.0 »
  add column author_name text,       -- crédit affiché : pseudonyme ParkQuest ou auteur externe
  add column source_url text,        -- page d'origine (ex. fichier Wikimedia Commons)
  add column consent_at timestamptz, -- l'auteur a accepté la licence (photos de la communauté)
  add column public_url text,        -- URL publique une fois publiée (park-media ou externe)
  add column is_cover boolean not null default false;

-- Une seule photo de couverture par spot.
create unique index media_one_cover_per_spot on public.media (spot_id) where is_cover;
create index media_spot_public_idx on public.media (spot_id, moderation_status) where public_url is not null;

-- Un utilisateur ne peut créer que des photos « communauté » en attente, sans URL publique
-- ni couverture (ces champs sont réservés au serveur et aux éditeurs du parc).
drop policy media_insert_user on public.media;
create policy media_insert_user on public.media for insert to authenticated
  with check (
    (
      owner_id = (select auth.uid())
      and moderation_status = 'PENDING'
      and source = 'COMMUNITY'
      and public_url is null
      and not is_cover
      and public.is_park_public(park_id)
    )
    or (owner_id is null and public.can_edit_park(park_id))
  );

-- ---------------------------------------------------------------------------
-- Proposer une photo de spot (après envoi du fichier dans user-photos/<uid>/…).
-- ---------------------------------------------------------------------------
create or replace function public.submit_spot_photo(
  p_spot_id uuid,
  p_storage_path text,
  p_width int,
  p_height int,
  p_alt text,
  p_license_consent boolean
) returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_spot public.spots;
  v_author text;
  v_id uuid;
begin
  if not coalesce(p_license_consent, false) then
    raise exception 'CONSENT_REQUIRED' using errcode = '22023';
  end if;
  select * into v_spot from public.spots where id = p_spot_id and status = 'PUBLISHED';
  if not found or not public.is_park_public(v_spot.park_id) then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  -- Le fichier doit être dans le dossier privé de l'auteur.
  if p_storage_path is null or split_part(p_storage_path, '/', 1) <> v_uid::text or p_storage_path like '%..%' then
    raise exception 'INVALID_PATH' using errcode = '22023';
  end if;
  -- Anti-abus : 20 photos proposées par 24 h au maximum.
  if (select count(*) from public.media where owner_id = v_uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMITED' using errcode = '54000';
  end if;

  select username into v_author from public.profiles where id = v_uid;

  insert into public.media (owner_id, park_id, spot_id, kind, storage_path, width, height, alt_text,
                            moderation_status, source, license, author_name, consent_at)
  values (v_uid, v_spot.park_id, p_spot_id, 'IMAGE', p_storage_path, p_width, p_height, left(p_alt, 200),
          'PENDING', 'COMMUNITY', 'CC BY-SA 4.0', v_author, now())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Choisir la photo de couverture d'un spot (éditeurs du parc, photo publiée uniquement).
-- ---------------------------------------------------------------------------
create or replace function public.set_spot_cover(p_media_id uuid)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_m public.media;
begin
  perform public._require_uid();
  select * into v_m from public.media where id = p_media_id for update;
  if not found or v_m.spot_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.can_edit_park(v_m.park_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_m.moderation_status <> 'APPROVED' or v_m.public_url is null then
    raise exception 'NOT_PUBLISHED' using errcode = '22023';
  end if;
  update public.media set is_cover = false where spot_id = v_m.spot_id and is_cover;
  update public.media set is_cover = true where id = p_media_id;
end;
$$;

revoke execute on function public.submit_spot_photo(uuid, text, int, int, text, boolean) from public, anon;
revoke execute on function public.set_spot_cover(uuid) from public, anon;
grant execute on function public.submit_spot_photo(uuid, text, int, int, text, boolean) to authenticated;
grant execute on function public.set_spot_cover(uuid) to authenticated;
