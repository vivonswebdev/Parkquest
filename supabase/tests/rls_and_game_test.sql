-- ParkQuest — tests RLS & règles de jeu.
-- Exécution : npm run db:test  (Postgres local + PostGIS, voir README)
-- Chaque assertion lève une exception en cas d'échec.

\set ON_ERROR_STOP 1
begin;

-- Utilisateurs de test
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'alice@test.local'),   -- USER
  ('aaaaaaaa-0000-4000-8000-000000000002', 'bob@test.local'),     -- USER
  ('aaaaaaaa-0000-4000-8000-000000000003', 'meise-admin@test.local'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'meise-editor@test.local');

insert into public.user_roles (user_id, role, park_id) values
  ('aaaaaaaa-0000-4000-8000-000000000003', 'PARK_ADMIN', '00000001-0000-4000-8000-000000000001'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'EDITOR', '00000001-0000-4000-8000-000000000001');

-- Contenu brouillon pour tester la visibilité
insert into public.spots (id, park_id, slug, kind, status, location)
values ('bbbbbbbb-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'brouillon', 'TREE', 'DRAFT',
        extensions.st_setsrid(extensions.st_makepoint(4.325, 50.928), 4326)::extensions.geography);

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p::text, ''), true);
  if p is null then
    execute 'set local role anon';
  else
    execute 'set local role authenticated';
  end if;
end $$;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ÉCHEC: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

-- 1. Anonyme : contenu publié visible, brouillon invisible, bonne réponse invisible
select pg_temp.as_user(null);
select pg_temp.assert((select count(*) from public.spots where park_id = '00000001-0000-4000-8000-000000000001') = 12, 'anon voit 12 spots publiés');
select pg_temp.assert(not exists (select 1 from public.spots where slug = 'brouillon'), 'anon ne voit pas le brouillon');
do $$ begin
  perform is_correct from public.quiz_answers limit 1;
  raise exception 'ÉCHEC: anon lit is_correct';
exception when insufficient_privilege then raise notice 'ok  anon ne peut pas lire quiz_answers.is_correct';
end $$;
do $$ begin
  perform public.discover_spot('00000003-0000-4000-8000-000000000001');
  raise exception 'ÉCHEC: anon a pu découvrir un spot';
exception when insufficient_privilege then raise notice 'ok  anon ne peut pas appeler discover_spot';
end $$;

-- 1b. « Autour de vous » : spots et services proches, traduits, sans position stockée
select pg_temp.assert(
  (select slug from public.nearby_spots('00000001-0000-4000-8000-000000000001', 50.92845, 4.32505, 500, 'fr') limit 1) = 'sequoia-geant',
  'nearby_spots : le séquoia est le plus proche');
select pg_temp.assert(
  (select 'remarkable-trees' = any(categories) from public.nearby_spots('00000001-0000-4000-8000-000000000001', 50.92845, 4.32505, 500, 'fr') limit 1),
  'nearby_spots renvoie les catégories');
select pg_temp.assert(
  (select count(*) from public.nearby_facilities('00000001-0000-4000-8000-000000000001', 50.9296, 4.3271, 200, 'fr')) >= 3,
  'nearby_facilities trouve les services près de l''entrée');

-- 2. Alice : ne peut pas s'attribuer de points ni écrire une découverte directement
reset role;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
do $$ begin
  insert into public.point_transactions (user_id, amount, reason) values ('aaaaaaaa-0000-4000-8000-000000000001', 1000, 'ADMIN_ADJUSTMENT');
  raise exception 'ÉCHEC: insertion directe de points';
exception when insufficient_privilege then raise notice 'ok  insertion directe de points refusée';
end $$;
do $$ begin
  insert into public.user_roles (user_id, role) values ('aaaaaaaa-0000-4000-8000-000000000001', 'SUPER_ADMIN');
  raise exception 'ÉCHEC: auto-promotion SUPER_ADMIN';
exception when insufficient_privilege then raise notice 'ok  auto-promotion refusée';
end $$;

-- 3. Découverte GPS : précision insuffisante → SELF_DECLARED sans visite = 0 point
select pg_temp.assert(
  (public.discover_spot('00000003-0000-4000-8000-000000000001', null, 50.92845, 4.32505, 60) ->> 'method') = 'SELF_DECLARED',
  'précision 60 m → pas de validation GPS');
select pg_temp.assert(
  (select coalesce(sum(amount), 0) from public.point_transactions) = 0,
  'découverte déclarative hors visite : 0 point');

-- 4. Visite + découverte GPS fiable → +10, puis doublon → ALREADY_DISCOVERED
select public.start_visit('00000001-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001') as visit_id \gset
select pg_temp.assert(
  (public.discover_spot('00000003-0000-4000-8000-000000000002', :'visit_id', 50.92706, 4.32366, 8) ->> 'method') = 'GPS_VERIFIED',
  'précision 8 m à 1 m du chêne → GPS_VERIFIED');
select pg_temp.assert(
  (public.discover_spot('00000003-0000-4000-8000-000000000002', :'visit_id', 50.92706, 4.32366, 8) ->> 'status') = 'ALREADY_DISCOVERED',
  'doublon refusé');
select pg_temp.assert(
  (public.discover_spot('00000003-0000-4000-8000-000000000003', :'visit_id', 50.9400, 4.3400, 5) ->> 'status') = 'TOO_FAR',
  'GPS fiable mais à >250 m → TOO_FAR');
select pg_temp.assert((select sum(amount) from public.point_transactions) = 10, '10 points au total');
select pg_temp.assert(exists (select 1 from public.user_badges ub join public.badges b on b.id = ub.badge_id where b.key = 'premier-pas'), 'badge Premier pas attribué');
select pg_temp.assert((select accuracy_m from public.visit_spots where spot_id = '00000003-0000-4000-8000-000000000002') = 8, 'seules distance/précision stockées');

-- 5. Quiz : mauvaise réponse d'abord → aucun point même si bonne ensuite
select pg_temp.assert(
  (public.submit_quiz_answer('00000007-0000-4000-8000-000000000001', '00000008-0000-4000-8000-000000000001') ->> 'is_correct')::boolean = false,
  'mauvaise réponse détectée');
select pg_temp.assert(
  (public.submit_quiz_answer('00000007-0000-4000-8000-000000000001', '00000008-0000-4000-8000-000000000002') ->> 'points_awarded')::int = 0,
  'bonne réponse au 2e essai : 0 point');
select pg_temp.assert(
  (public.submit_quiz_answer('00000007-0000-4000-8000-000000000002', '00000008-0000-4000-8000-000000000004') ->> 'points_awarded')::int = 10,
  'bonne réponse au 1er essai : +10');

-- 6. Défi photo sans photo → refusé ; défi observation → +20
do $$ begin
  perform public.complete_challenge('00000009-0000-4000-8000-000000000001');
  raise exception 'ÉCHEC: défi photo sans photo';
exception when invalid_parameter_value then raise notice 'ok  défi photo sans photo refusé';
end $$;
select pg_temp.assert(
  (public.complete_challenge('00000009-0000-4000-8000-000000000002') ->> 'points_awarded')::int = 20,
  'défi observation : +20');

-- 7. Bob ne voit rien des données d'Alice
reset role;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
select pg_temp.assert((select count(*) from public.visits) = 0, 'Bob ne voit pas les visites d''Alice');
select pg_temp.assert((select count(*) from public.visit_spots) = 0, 'Bob ne voit pas les découvertes d''Alice');
select pg_temp.assert((select count(*) from public.point_transactions) = 0, 'Bob ne voit pas les points d''Alice');

-- 8. Éditeur Meise : voit le brouillon, modifie Meise, pas Central Park
reset role;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000004');
select pg_temp.assert(exists (select 1 from public.spots where slug = 'brouillon'), 'éditeur voit le brouillon de son parc');
update public.spot_translations set summary = 'maj éditeur' where spot_id = '00000003-0000-4000-8000-000000000001' and locale = 'fr';
select pg_temp.assert(
  (select summary from public.spot_translations where spot_id = '00000003-0000-4000-8000-000000000001' and locale = 'fr') = 'maj éditeur',
  'éditeur modifie un contenu Meise');
update public.park_translations set tagline = 'piraté' where park_id = '00000001-0000-4000-8000-000000000002';
select pg_temp.assert(
  (select tagline from public.park_translations where park_id = '00000001-0000-4000-8000-000000000002' and locale = 'en') <> 'piraté',
  'éditeur Meise ne peut PAS modifier Central Park');
do $$ begin
  insert into public.user_roles (user_id, role, park_id) values ('aaaaaaaa-0000-4000-8000-000000000004', 'PARK_ADMIN', '00000001-0000-4000-8000-000000000001');
  raise exception 'ÉCHEC: éditeur s''auto-promeut';
exception when insufficient_privilege then raise notice 'ok  éditeur ne peut pas se promouvoir PARK_ADMIN';
end $$;

-- 9. Admin Meise : peut nommer un modérateur sur Meise, pas sur Central Park
reset role;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000003');
insert into public.user_roles (user_id, role, park_id) values ('aaaaaaaa-0000-4000-8000-000000000002', 'MODERATOR', '00000001-0000-4000-8000-000000000001');
select pg_temp.assert(true, 'admin Meise nomme un modérateur Meise');
do $$ begin
  insert into public.user_roles (user_id, role, park_id) values ('aaaaaaaa-0000-4000-8000-000000000002', 'MODERATOR', '00000001-0000-4000-8000-000000000002');
  raise exception 'ÉCHEC: admin Meise agit sur Central Park';
exception when insufficient_privilege then raise notice 'ok  admin Meise ne peut pas agir sur Central Park';
end $$;

-- 10. Commentaire utilisateur : forcément PENDING
reset role;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
do $$ begin
  insert into public.comments (author_id, park_id, spot_id, body, moderation_status)
  values ('aaaaaaaa-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', 'Super !', 'APPROVED');
  raise exception 'ÉCHEC: commentaire auto-approuvé';
exception when insufficient_privilege then raise notice 'ok  commentaire auto-approuvé refusé';
end $$;
insert into public.comments (author_id, park_id, spot_id, body)
values ('aaaaaaaa-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', 'Super !');
reset role;
select pg_temp.as_user(null);
select pg_temp.assert((select count(*) from public.comments) = 0, 'commentaire PENDING invisible au public');

reset role;
rollback;
\echo 'Tous les tests RLS & jeu sont passés.'
