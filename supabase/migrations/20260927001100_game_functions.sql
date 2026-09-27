-- ParkQuest — 1100 : fonctions métier sécurisées (géo, visites, découvertes, quiz, défis, points, badges).
--
-- Toutes les mutations « de jeu » passent ici. Le client n'écrit jamais de points.
-- Paramètres de validation GPS (documentés dans le README) :
--   * précision max pour une validation GPS : 25 m
--   * distance max : spots.discovery_radius_m (35 m par défaut)
--   * au-delà de 250 m (avec GPS fiable) : découverte refusée (TOO_FAR)
--   * sinon, ou sans GPS : découverte SELF_DECLARED (collection oui ; points réduits,
--     et uniquement pendant une visite active du parc)

-- ---------------------------------------------------------------------------
-- nearby_spots : spots publiés proches d'un point, nom traduit avec repli
-- langue demandée → anglais → langue principale du parc.
-- SECURITY INVOKER : la RLS s'applique. Les coordonnées reçues ne sont pas stockées.
-- ---------------------------------------------------------------------------

create or replace function public.nearby_spots(
  p_park_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_m integer default 300,
  p_locale text default 'en'
)
returns table (
  spot_id uuid,
  slug text,
  kind public.spot_kind,
  name text,
  label text,
  distance_m integer,
  latitude double precision,
  longitude double precision
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
    round(extensions.st_distance(s.location, o.g))::int,
    extensions.st_y(s.location::extensions.geometry),
    extensions.st_x(s.location::extensions.geometry)
  from public.spots s
  join public.parks p on p.id = s.park_id
  cross join origin o
  left join lateral (
    select t.name, t.label
    from public.spot_translations t
    where t.spot_id = s.id
    order by case
      when t.locale = p_locale then 0
      when t.locale = 'en' then 1
      when t.locale = p.default_locale then 2
      else 3 end
    limit 1
  ) tr on true
  where s.park_id = p_park_id
    and s.status = 'PUBLISHED'
    and p_latitude between -90 and 90
    and p_longitude between -180 and 180
    and extensions.st_dwithin(s.location, o.g, least(greatest(coalesce(p_radius_m, 300), 1), 5000))
  order by extensions.st_distance(s.location, o.g)
  limit 50;
$$;

grant execute on function public.nearby_spots(uuid, double precision, double precision, integer, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aides internes (non exposées aux clients)
-- ---------------------------------------------------------------------------

create or replace function public._require_uid()
returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare v uuid := auth.uid();
begin
  if v is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  return v;
end;
$$;

-- Insère une transaction de points de façon idempotente. Retourne le montant réellement accordé.
create or replace function public._award_points(
  p_user_id uuid, p_park_id uuid, p_amount int, p_reason public.point_reason, p_source_id uuid, p_note text default null
)
returns int
language plpgsql volatile security definer set search_path = ''
as $$
declare v_rows int;
begin
  if p_amount is null or p_amount = 0 then
    return 0;
  end if;
  insert into public.point_transactions (user_id, park_id, amount, reason, source_id, note)
  values (p_user_id, p_park_id, p_amount, p_reason, p_source_id, p_note)
  on conflict (user_id, reason, source_id) where reason <> 'ADMIN_ADJUSTMENT' and source_id is not null
  do nothing;
  get diagnostics v_rows = row_count;
  return case when v_rows > 0 then p_amount else 0 end;
end;
$$;

-- Évalue et attribue les badges atteints. Retourne les clés des nouveaux badges.
create or replace function public._evaluate_badges(p_user_id uuid)
returns text[]
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_spots int; v_quizzes int; v_photos int; v_distance int; v_trails int; v_challenges int;
  v_new text[];
begin
  select count(*) into v_spots from public.visit_spots where user_id = p_user_id;
  select count(*) into v_quizzes from public.point_transactions where user_id = p_user_id and reason = 'QUIZ_PASSED';
  select count(*) into v_photos from public.point_transactions where user_id = p_user_id and reason = 'PHOTO_APPROVED';
  select count(*) into v_trails from public.point_transactions where user_id = p_user_id and reason = 'TRAIL_COMPLETED';
  select count(*) into v_challenges from public.challenge_completions where user_id = p_user_id and status = 'APPROVED';
  select coalesce(sum(distance_m), 0) into v_distance from public.visits where user_id = p_user_id;

  with eligible as (
    select b.id, b.key::text as key
    from public.badges b
    where (b.park_id is null or public.is_park_public(b.park_id))
      and case b.criteria
        when 'SPOTS_DISCOVERED' then v_spots
        when 'QUIZZES_PASSED' then v_quizzes
        when 'PHOTOS_APPROVED' then v_photos
        when 'DISTANCE_M' then v_distance
        when 'TRAILS_COMPLETED' then v_trails
        when 'CHALLENGES_COMPLETED' then v_challenges
      end >= b.threshold
  ), inserted as (
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, e.id from eligible e
    on conflict (user_id, badge_id) do nothing
    returning badge_id
  )
  select coalesce(array_agg(e.key), '{}') into v_new
  from inserted i join eligible e on e.id = i.badge_id;

  return v_new;
end;
$$;

revoke execute on function public._require_uid() from public, anon, authenticated;
revoke execute on function public._award_points(uuid, uuid, int, public.point_reason, uuid, text) from public, anon, authenticated;
revoke execute on function public._evaluate_badges(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Visites
-- ---------------------------------------------------------------------------

create or replace function public.start_visit(p_park_id uuid, p_trail_id uuid default null)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_visit uuid;
begin
  if not public.is_park_public(p_park_id) then
    raise exception 'PARK_NOT_FOUND' using errcode = 'P0002';
  end if;
  if p_trail_id is not null and not exists (
    select 1 from public.trails t where t.id = p_trail_id and t.park_id = p_park_id and t.status = 'PUBLISHED'
  ) then
    raise exception 'TRAIL_NOT_FOUND' using errcode = 'P0002';
  end if;

  select id into v_visit from public.visits
  where user_id = v_uid and park_id = p_park_id and status in ('IN_PROGRESS', 'PAUSED');

  if v_visit is not null then
    update public.visits
      set status = 'IN_PROGRESS', trail_id = coalesce(p_trail_id, trail_id)
      where id = v_visit;
    return v_visit;
  end if;

  insert into public.visits (user_id, park_id, trail_id)
  values (v_uid, p_park_id, p_trail_id)
  returning id into v_visit;
  return v_visit;
end;
$$;

-- Pause / reprise / abandon + distance cumulée (monotone, bornée).
create or replace function public.update_visit(
  p_visit_id uuid, p_status public.visit_status default null, p_distance_m int default null
)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare v_uid uuid := public._require_uid();
begin
  if p_status = 'COMPLETED' then
    raise exception 'USE_COMPLETE_VISIT' using errcode = '22023';
  end if;
  update public.visits v set
    status = coalesce(p_status, v.status),
    distance_m = greatest(v.distance_m, least(coalesce(p_distance_m, 0), 100000)),
    ended_at = case when p_status = 'ABANDONED' then now() else v.ended_at end
  where v.id = p_visit_id and v.user_id = v_uid and v.status in ('IN_PROGRESS', 'PAUSED');
  if not found then
    raise exception 'VISIT_NOT_ACTIVE' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.complete_visit(p_visit_id uuid, p_distance_m int default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_visit public.visits;
  v_total int; v_found int; v_points int := 0; v_trail_points int;
begin
  select * into v_visit from public.visits
  where id = p_visit_id and user_id = v_uid and status in ('IN_PROGRESS', 'PAUSED')
  for update;
  if not found then
    raise exception 'VISIT_NOT_ACTIVE' using errcode = 'P0002';
  end if;

  update public.visits set
    status = 'COMPLETED',
    ended_at = now(),
    distance_m = greatest(distance_m, least(coalesce(p_distance_m, 0), 100000))
  where id = p_visit_id;

  if v_visit.trail_id is not null then
    select count(*), count(vs.id) into v_total, v_found
    from public.trail_spots ts
    left join public.visit_spots vs on vs.spot_id = ts.spot_id and vs.user_id = v_uid
    where ts.trail_id = v_visit.trail_id;

    if v_total > 0 and v_found = v_total then
      select completion_points into v_trail_points from public.trails where id = v_visit.trail_id;
      v_points := public._award_points(v_uid, v_visit.park_id, v_trail_points, 'TRAIL_COMPLETED', v_visit.trail_id);
    end if;
  end if;

  return jsonb_build_object(
    'trail_completed', coalesce(v_total > 0 and v_found = v_total, false),
    'spots_found', coalesce(v_found, 0),
    'spots_total', coalesce(v_total, 0),
    'points_awarded', v_points,
    'new_badges', to_jsonb(public._evaluate_badges(v_uid))
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Découverte d'un spot — validée côté serveur, jamais automatiquement.
-- Le client appelle cette fonction uniquement après un geste explicite
-- (« Découvrir ce spot »). Aucune coordonnée brute n'est conservée.
-- ---------------------------------------------------------------------------

create or replace function public.discover_spot(
  p_spot_id uuid,
  p_visit_id uuid default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_accuracy_m double precision default null
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_spot public.spots;
  v_distance int;
  v_accuracy int;
  v_method public.discovery_method;
  v_active_visit uuid;
  v_points int := 0;
  c_max_accuracy constant int := 25;
  c_reject_distance constant int := 250;
begin
  select s.* into v_spot from public.spots s
  where s.id = p_spot_id and s.status = 'PUBLISHED' and public.is_park_public(s.park_id);
  if not found then
    raise exception 'SPOT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.visit_spots where user_id = v_uid and spot_id = p_spot_id) then
    return jsonb_build_object('status', 'ALREADY_DISCOVERED', 'points_awarded', 0, 'new_badges', '[]'::jsonb);
  end if;

  -- Visite active (fournie ou implicite) dans ce parc.
  select v.id into v_active_visit from public.visits v
  where v.user_id = v_uid and v.park_id = v_spot.park_id and v.status in ('IN_PROGRESS', 'PAUSED')
    and (p_visit_id is null or v.id = p_visit_id)
  limit 1;

  if p_latitude is not null and p_longitude is not null
     and p_latitude between -90 and 90 and p_longitude between -180 and 180 then
    v_distance := round(extensions.st_distance(
      v_spot.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
    ))::int;
    v_accuracy := case when p_accuracy_m is null then null else round(least(p_accuracy_m, 100000))::int end;

    if v_accuracy is not null and v_accuracy <= c_max_accuracy and v_distance <= v_spot.discovery_radius_m then
      v_method := 'GPS_VERIFIED';
    elsif v_accuracy is not null and v_accuracy <= c_max_accuracy and v_distance > c_reject_distance then
      return jsonb_build_object('status', 'TOO_FAR', 'distance_m', v_distance, 'points_awarded', 0, 'new_badges', '[]'::jsonb);
    else
      v_method := 'SELF_DECLARED';
    end if;
  else
    v_method := 'SELF_DECLARED';
  end if;

  insert into public.visit_spots (user_id, spot_id, visit_id, method, distance_m, accuracy_m)
  values (v_uid, p_spot_id, v_active_visit, v_method, v_distance, v_accuracy)
  on conflict (user_id, spot_id) do nothing;
  if not found then
    return jsonb_build_object('status', 'ALREADY_DISCOVERED', 'points_awarded', 0, 'new_badges', '[]'::jsonb);
  end if;

  if v_method = 'GPS_VERIFIED' then
    v_points := public._award_points(v_uid, v_spot.park_id, v_spot.points_value, 'SPOT_DISCOVERED', p_spot_id);
  elsif v_active_visit is not null then
    v_points := public._award_points(v_uid, v_spot.park_id, ceil(v_spot.points_value / 2.0)::int, 'SPOT_DISCOVERED', p_spot_id);
  end if;

  return jsonb_build_object(
    'status', 'DISCOVERED',
    'method', v_method,
    'distance_m', v_distance,
    'points_awarded', v_points,
    'new_badges', to_jsonb(public._evaluate_badges(v_uid))
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Quiz : les points ne sont accordés que si la PREMIÈRE tentative est correcte.
-- ---------------------------------------------------------------------------

create or replace function public.submit_quiz_answer(p_quiz_id uuid, p_answer_id uuid, p_visit_id uuid default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_quiz public.quizzes;
  v_correct boolean;
  v_correct_id uuid;
  v_first boolean;
  v_points int := 0;
begin
  select q.* into v_quiz from public.quizzes q
  where q.id = p_quiz_id and q.status = 'PUBLISHED' and public.is_park_public(q.park_id);
  if not found then
    raise exception 'QUIZ_NOT_FOUND' using errcode = 'P0002';
  end if;

  select a.is_correct into v_correct from public.quiz_answers a where a.id = p_answer_id and a.quiz_id = p_quiz_id;
  if not found then
    raise exception 'ANSWER_NOT_FOUND' using errcode = 'P0002';
  end if;
  select a.id into v_correct_id from public.quiz_answers a where a.quiz_id = p_quiz_id and a.is_correct;

  v_first := not exists (select 1 from public.quiz_attempts where user_id = v_uid and quiz_id = p_quiz_id);

  insert into public.quiz_attempts (user_id, quiz_id, answer_id, visit_id, is_correct)
  values (
    v_uid, p_quiz_id, p_answer_id,
    (select id from public.visits where id = p_visit_id and user_id = v_uid),
    v_correct
  );

  if v_correct and v_first then
    v_points := public._award_points(v_uid, v_quiz.park_id, v_quiz.points_value, 'QUIZ_PASSED', p_quiz_id);
  end if;

  return jsonb_build_object(
    'is_correct', v_correct,
    'correct_answer_id', v_correct_id,
    'first_attempt', v_first,
    'points_awarded', v_points,
    'new_badges', to_jsonb(public._evaluate_badges(v_uid))
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Défis
-- ---------------------------------------------------------------------------

create or replace function public.complete_challenge(
  p_challenge_id uuid, p_visit_id uuid default null, p_media_id uuid default null
)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_ch public.challenges;
  v_status public.moderation_status;
  v_points int := 0;
  v_metric int;
begin
  select c.* into v_ch from public.challenges c
  where c.id = p_challenge_id and c.status = 'PUBLISHED' and public.is_park_public(c.park_id);
  if not found then
    raise exception 'CHALLENGE_NOT_FOUND' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.challenge_completions where user_id = v_uid and challenge_id = p_challenge_id) then
    return jsonb_build_object('status', 'ALREADY_SUBMITTED', 'points_awarded', 0, 'new_badges', '[]'::jsonb);
  end if;

  if v_ch.requires_photo then
    if p_media_id is null or not exists (
      select 1 from public.media m where m.id = p_media_id and m.owner_id = v_uid and m.park_id = v_ch.park_id
    ) then
      raise exception 'PHOTO_REQUIRED' using errcode = '22023';
    end if;
    v_status := 'PENDING';   -- points attribués après modération
  elsif v_ch.type = 'WALK' then
    select coalesce(sum(distance_m), 0) into v_metric from public.visits where user_id = v_uid and park_id = v_ch.park_id;
    if v_metric < coalesce(v_ch.target_value, 0) then
      return jsonb_build_object('status', 'NOT_REACHED', 'progress', v_metric, 'target', v_ch.target_value,
                                'points_awarded', 0, 'new_badges', '[]'::jsonb);
    end if;
    v_status := 'APPROVED';
  elsif v_ch.type = 'QUIZ_STREAK' then
    select count(*) into v_metric from public.point_transactions
    where user_id = v_uid and park_id = v_ch.park_id and reason = 'QUIZ_PASSED';
    if v_metric < coalesce(v_ch.target_value, 1) then
      return jsonb_build_object('status', 'NOT_REACHED', 'progress', v_metric, 'target', v_ch.target_value,
                                'points_awarded', 0, 'new_badges', '[]'::jsonb);
    end if;
    v_status := 'APPROVED';
  else
    v_status := 'APPROVED';  -- OBSERVATION : déclaratif
  end if;

  insert into public.challenge_completions (user_id, challenge_id, visit_id, media_id, status)
  values (v_uid, p_challenge_id,
          (select id from public.visits where id = p_visit_id and user_id = v_uid),
          p_media_id, v_status);

  if v_status = 'APPROVED' then
    v_points := public._award_points(v_uid, v_ch.park_id, v_ch.points_value, 'CHALLENGE_COMPLETED', p_challenge_id);
  end if;

  return jsonb_build_object(
    'status', v_status,
    'points_awarded', v_points,
    'new_badges', to_jsonb(public._evaluate_badges(v_uid))
  );
end;
$$;

create or replace function public.review_challenge_completion(p_completion_id uuid, p_approve boolean)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_cc public.challenge_completions;
  v_ch public.challenges;
begin
  select * into v_cc from public.challenge_completions where id = p_completion_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  select * into v_ch from public.challenges where id = v_cc.challenge_id;
  if not public.can_moderate_park(v_ch.park_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.challenge_completions
    set status = case when p_approve then 'APPROVED'::public.moderation_status else 'REJECTED'::public.moderation_status end,
        reviewed_by = v_uid, reviewed_at = now()
    where id = p_completion_id;

  if p_approve then
    perform public._award_points(v_cc.user_id, v_ch.park_id, v_ch.points_value, 'CHALLENGE_COMPLETED', v_ch.id);
    perform public._evaluate_badges(v_cc.user_id);
  end if;
end;
$$;

-- Modération d'une photo utilisateur (+5 points à l'approbation).
create or replace function public.moderate_media(p_media_id uuid, p_approve boolean)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := public._require_uid();
  v_m public.media;
begin
  select * into v_m from public.media where id = p_media_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if not public.can_moderate_park(v_m.park_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.media
    set moderation_status = case when p_approve then 'APPROVED'::public.moderation_status else 'REJECTED'::public.moderation_status end,
        moderated_by = v_uid, moderated_at = now()
    where id = p_media_id;

  if p_approve and v_m.owner_id is not null then
    perform public._award_points(v_m.owner_id, v_m.park_id, 5, 'PHOTO_APPROVED', v_m.id);
    perform public._evaluate_badges(v_m.owner_id);
  end if;
end;
$$;

-- Ajustement manuel (+/-) par l'admin du parc, tracé.
create or replace function public.admin_adjust_points(p_user_id uuid, p_park_id uuid, p_amount int, p_note text)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare v_uid uuid := public._require_uid();
begin
  if not public.can_admin_park(p_park_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'NOTE_REQUIRED' using errcode = '22023';
  end if;
  insert into public.point_transactions (user_id, park_id, amount, reason, note, created_by)
  values (p_user_id, p_park_id, p_amount, 'ADMIN_ADJUSTMENT', p_note, v_uid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Lecture : statistiques personnelles et progression de collection.
-- ---------------------------------------------------------------------------

create or replace function public.get_my_stats()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'total_points', coalesce((select sum(amount) from public.point_transactions where user_id = auth.uid()), 0),
    'visits', (select count(*) from public.visits where user_id = auth.uid()),
    'spots_discovered', (select count(*) from public.visit_spots where user_id = auth.uid()),
    'distance_m', coalesce((select sum(distance_m) from public.visits where user_id = auth.uid()), 0),
    'photos_approved', (select count(*) from public.media where owner_id = auth.uid() and moderation_status = 'APPROVED'),
    'badges', (select count(*) from public.user_badges where user_id = auth.uid()),
    'quizzes_passed', (select count(*) from public.point_transactions where user_id = auth.uid() and reason = 'QUIZ_PASSED')
  )
  where auth.uid() is not null;
$$;

create or replace function public.park_collection_progress(p_park_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'discovered', (select count(*) from public.visit_spots vs join public.spots s on s.id = vs.spot_id
                   where vs.user_id = auth.uid() and s.park_id = p_park_id),
    'total', (select count(*) from public.spots s where s.park_id = p_park_id and s.status = 'PUBLISHED')
  )
  where auth.uid() is not null and public.is_park_public(p_park_id);
$$;

-- Clé de réponses pour l'édition admin (réservée aux éditeurs du parc).
create or replace function public.get_quiz_answer_key(p_quiz_id uuid)
returns table (answer_id uuid, is_correct boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.quizzes q where q.id = p_quiz_id and public.can_edit_park(q.park_id)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query select a.id, a.is_correct from public.quiz_answers a where a.quiz_id = p_quiz_id;
end;
$$;

-- Fonctions de jeu : réservées aux utilisateurs connectés.
revoke execute on function public.start_visit(uuid, uuid) from public, anon;
revoke execute on function public.update_visit(uuid, public.visit_status, int) from public, anon;
revoke execute on function public.complete_visit(uuid, int) from public, anon;
revoke execute on function public.discover_spot(uuid, uuid, double precision, double precision, double precision) from public, anon;
revoke execute on function public.submit_quiz_answer(uuid, uuid, uuid) from public, anon;
revoke execute on function public.complete_challenge(uuid, uuid, uuid) from public, anon;
revoke execute on function public.review_challenge_completion(uuid, boolean) from public, anon;
revoke execute on function public.moderate_media(uuid, boolean) from public, anon;
revoke execute on function public.admin_adjust_points(uuid, uuid, int, text) from public, anon;
revoke execute on function public.get_my_stats() from public, anon;
revoke execute on function public.park_collection_progress(uuid) from public, anon;
revoke execute on function public.get_quiz_answer_key(uuid) from public, anon;

grant execute on function public.start_visit(uuid, uuid) to authenticated;
grant execute on function public.update_visit(uuid, public.visit_status, int) to authenticated;
grant execute on function public.complete_visit(uuid, int) to authenticated;
grant execute on function public.discover_spot(uuid, uuid, double precision, double precision, double precision) to authenticated;
grant execute on function public.submit_quiz_answer(uuid, uuid, uuid) to authenticated;
grant execute on function public.complete_challenge(uuid, uuid, uuid) to authenticated;
grant execute on function public.review_challenge_completion(uuid, boolean) to authenticated;
grant execute on function public.moderate_media(uuid, boolean) to authenticated;
grant execute on function public.admin_adjust_points(uuid, uuid, int, text) to authenticated;
grant execute on function public.get_my_stats() to authenticated;
grant execute on function public.park_collection_progress(uuid) to authenticated;
grant execute on function public.get_quiz_answer_key(uuid) to authenticated;
