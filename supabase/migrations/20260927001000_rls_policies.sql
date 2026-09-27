-- ParkQuest — 1000 : Row Level Security.
--
-- Principes :
--  * Contenu PUBLISHED d'un parc PUBLISHED : lisible par tous (anon inclus).
--  * DRAFT / ARCHIVED : visibles uniquement par l'équipe du parc (PARK_ADMIN, EDITOR, MODERATOR)
--    et le staff plateforme (SUPER_ADMIN, PLATFORM_ADMIN).
--  * Écriture de contenu : PARK_ADMIN / EDITOR du parc concerné, ou staff plateforme.
--    Un admin de Meise ne peut donc jamais modifier Central Park.
--  * Données personnelles (visites, découvertes, points, badges, favoris) : propriétaire uniquement.
--  * Points, découvertes, tentatives de quiz, validations de défis : AUCUNE écriture directe.
--    Tout passe par des fonctions SECURITY DEFINER (migration 1100).

-- ---------------------------------------------------------------------------
-- Aides de visibilité
-- ---------------------------------------------------------------------------

create or replace function public.is_park_staff(p_park_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_park_role(p_park_id, array['PARK_ADMIN', 'EDITOR', 'MODERATOR']::public.app_role[]);
$$;

create or replace function public.is_park_public(p_park_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.parks p where p.id = p_park_id and p.status = 'PUBLISHED');
$$;

-- Contenu lisible : publié dans un parc publié, ou équipe du parc.
create or replace function public.can_read_content(p_park_id uuid, p_status public.content_status)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (p_status = 'PUBLISHED' and public.is_park_public(p_park_id))
      or public.is_park_staff(p_park_id);
$$;

-- ---------------------------------------------------------------------------
-- Activation RLS partout
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.parks enable row level security;
alter table public.park_translations enable row level security;
alter table public.park_practical_info enable row level security;
alter table public.spot_categories enable row level security;
alter table public.spot_category_translations enable row level security;
alter table public.spots enable row level security;
alter table public.spot_translations enable row level security;
alter table public.spot_category_relations enable row level security;
alter table public.trails enable row level security;
alter table public.trail_translations enable row level security;
alter table public.trail_spots enable row level security;
alter table public.trail_segments enable row level security;
alter table public.trail_segment_translations enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_translations enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_translations enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_answer_translations enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_translations enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.visits enable row level security;
alter table public.visit_spots enable row level security;
alter table public.point_transactions enable row level security;
alter table public.badges enable row level security;
alter table public.badge_translations enable row level security;
alter table public.user_badges enable row level security;
alter table public.media enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;
alter table public.user_favorites enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.article_translations enable row level security;

-- ---------------------------------------------------------------------------
-- Profils : lecture/écriture du propriétaire. Profil public via la vue public_profiles.
-- ---------------------------------------------------------------------------

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_platform_staff());

revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_url, preferred_locale) on public.profiles to authenticated;

create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Vue publique minimale (pseudonyme + avatar). Aucune donnée sensible, aucune position.
create view public.public_profiles
with (security_barrier = true)
as select id, username, display_name, avatar_url from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Rôles
-- ---------------------------------------------------------------------------

create policy user_roles_select on public.user_roles for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_platform_staff()
    or (park_id is not null and public.can_admin_park(park_id))
  );

-- SUPER_ADMIN : tout. PLATFORM_ADMIN : tout sauf SUPER_ADMIN.
-- PARK_ADMIN : EDITOR / MODERATOR sur son propre parc uniquement.
create policy user_roles_write on public.user_roles for all to authenticated
  using (
    public.is_super_admin()
    or (public.is_platform_staff() and role <> 'SUPER_ADMIN')
    or (park_id is not null and role in ('EDITOR', 'MODERATOR') and public.has_park_role(park_id, array['PARK_ADMIN']::public.app_role[]))
  )
  with check (
    public.is_super_admin()
    or (public.is_platform_staff() and role <> 'SUPER_ADMIN')
    or (park_id is not null and role in ('EDITOR', 'MODERATOR') and public.has_park_role(park_id, array['PARK_ADMIN']::public.app_role[]))
  );

-- ---------------------------------------------------------------------------
-- Parcs
-- ---------------------------------------------------------------------------

create policy parks_select on public.parks for select to anon, authenticated
  using (status = 'PUBLISHED' or public.is_park_staff(id));
create policy parks_insert on public.parks for insert to authenticated
  with check (public.is_platform_staff());
create policy parks_update on public.parks for update to authenticated
  using (public.can_admin_park(id)) with check (public.can_admin_park(id));
create policy parks_delete on public.parks for delete to authenticated
  using (public.is_platform_staff());

create policy park_translations_select on public.park_translations for select to anon, authenticated
  using (public.is_park_public(park_id) or public.is_park_staff(park_id));
create policy park_translations_write on public.park_translations for all to authenticated
  using (public.can_edit_park(park_id)) with check (public.can_edit_park(park_id));

create policy park_practical_info_select on public.park_practical_info for select to anon, authenticated
  using (public.is_park_public(park_id) or public.is_park_staff(park_id));
create policy park_practical_info_write on public.park_practical_info for all to authenticated
  using (public.can_edit_park(park_id)) with check (public.can_edit_park(park_id));

-- ---------------------------------------------------------------------------
-- Catégories de spots (globales = staff plateforme ; propres au parc = éditeurs du parc)
-- ---------------------------------------------------------------------------

create policy spot_categories_select on public.spot_categories for select to anon, authenticated
  using (park_id is null or public.is_park_public(park_id) or public.is_park_staff(park_id));
create policy spot_categories_write on public.spot_categories for all to authenticated
  using (case when park_id is null then public.is_platform_staff() else public.can_edit_park(park_id) end)
  with check (case when park_id is null then public.is_platform_staff() else public.can_edit_park(park_id) end);

create policy spot_category_translations_select on public.spot_category_translations for select to anon, authenticated
  using (exists (select 1 from public.spot_categories c where c.id = category_id));
create policy spot_category_translations_write on public.spot_category_translations for all to authenticated
  using (exists (select 1 from public.spot_categories c where c.id = category_id
    and case when c.park_id is null then public.is_platform_staff() else public.can_edit_park(c.park_id) end))
  with check (exists (select 1 from public.spot_categories c where c.id = category_id
    and case when c.park_id is null then public.is_platform_staff() else public.can_edit_park(c.park_id) end));

-- ---------------------------------------------------------------------------
-- Spots
-- ---------------------------------------------------------------------------

create policy spots_select on public.spots for select to anon, authenticated
  using (public.can_read_content(park_id, status));
create policy spots_write on public.spots for all to authenticated
  using (public.can_edit_park(park_id)) with check (public.can_edit_park(park_id));

create policy spot_translations_select on public.spot_translations for select to anon, authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id));
create policy spot_translations_write on public.spot_translations for all to authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id and public.can_edit_park(s.park_id)))
  with check (exists (select 1 from public.spots s where s.id = spot_id and public.can_edit_park(s.park_id)));

create policy spot_category_relations_select on public.spot_category_relations for select to anon, authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id));
create policy spot_category_relations_write on public.spot_category_relations for all to authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id and public.can_edit_park(s.park_id)))
  with check (exists (select 1 from public.spots s where s.id = spot_id and public.can_edit_park(s.park_id)));

-- ---------------------------------------------------------------------------
-- Parcours
-- ---------------------------------------------------------------------------

create policy trails_select on public.trails for select to anon, authenticated
  using (public.can_read_content(park_id, status));
create policy trails_write on public.trails for all to authenticated
  using (public.can_edit_park(park_id)) with check (public.can_edit_park(park_id));

create policy trail_translations_select on public.trail_translations for select to anon, authenticated
  using (exists (select 1 from public.trails t where t.id = trail_id));
create policy trail_translations_write on public.trail_translations for all to authenticated
  using (exists (select 1 from public.trails t where t.id = trail_id and public.can_edit_park(t.park_id)))
  with check (exists (select 1 from public.trails t where t.id = trail_id and public.can_edit_park(t.park_id)));

create policy trail_spots_select on public.trail_spots for select to anon, authenticated
  using (exists (select 1 from public.trails t where t.id = trail_id));
create policy trail_spots_write on public.trail_spots for all to authenticated
  using (exists (select 1 from public.trails t where t.id = trail_id and public.can_edit_park(t.park_id)))
  with check (
    exists (select 1 from public.trails t where t.id = trail_id and public.can_edit_park(t.park_id))
    -- le spot doit appartenir au même parc que le parcours
    and exists (select 1 from public.trails t join public.spots s on s.park_id = t.park_id
                where t.id = trail_id and s.id = spot_id)
  );

create policy trail_segments_select on public.trail_segments for select to anon, authenticated
  using (exists (select 1 from public.trails t where t.id = trail_id));
create policy trail_segments_write on public.trail_segments for all to authenticated
  using (exists (select 1 from public.trails t where t.id = trail_id and public.can_edit_park(t.park_id)))
  with check (exists (select 1 from public.trails t where t.id = trail_id and public.can_edit_park(t.park_id)));

create policy trail_segment_translations_select on public.trail_segment_translations for select to anon, authenticated
  using (exists (select 1 from public.trail_segments sg where sg.id = segment_id));
create policy trail_segment_translations_write on public.trail_segment_translations for all to authenticated
  using (exists (select 1 from public.trail_segments sg join public.trails t on t.id = sg.trail_id
                 where sg.id = segment_id and public.can_edit_park(t.park_id)))
  with check (exists (select 1 from public.trail_segments sg join public.trails t on t.id = sg.trail_id
                 where sg.id = segment_id and public.can_edit_park(t.park_id)));

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------

create policy facilities_select on public.facilities for select to anon, authenticated
  using (public.can_read_content(park_id, status));
create policy facilities_write on public.facilities for all to authenticated
  using (public.can_edit_park(park_id)) with check (public.can_edit_park(park_id));

create policy facility_translations_select on public.facility_translations for select to anon, authenticated
  using (exists (select 1 from public.facilities f where f.id = facility_id));
create policy facility_translations_write on public.facility_translations for all to authenticated
  using (exists (select 1 from public.facilities f where f.id = facility_id and public.can_edit_park(f.park_id)))
  with check (exists (select 1 from public.facilities f where f.id = facility_id and public.can_edit_park(f.park_id)));

-- ---------------------------------------------------------------------------
-- Quiz. La colonne quiz_answers.is_correct n'est jamais lisible par le client :
-- privilèges de colonnes + fonction submit_quiz_answer côté serveur.
-- ---------------------------------------------------------------------------

create policy quizzes_select on public.quizzes for select to anon, authenticated
  using (public.can_read_content(park_id, status));
create policy quizzes_write on public.quizzes for all to authenticated
  using (public.can_edit_park(park_id)) with check (public.can_edit_park(park_id));

create policy quiz_translations_select on public.quiz_translations for select to anon, authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id));
create policy quiz_translations_write on public.quiz_translations for all to authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_edit_park(q.park_id)))
  with check (exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_edit_park(q.park_id)));

revoke select on public.quiz_answers from anon, authenticated;
grant select (id, quiz_id, position, created_at, updated_at) on public.quiz_answers to anon, authenticated;

create policy quiz_answers_select on public.quiz_answers for select to anon, authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id));
create policy quiz_answers_write on public.quiz_answers for all to authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_edit_park(q.park_id)))
  with check (exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_edit_park(q.park_id)));

create policy quiz_answer_translations_select on public.quiz_answer_translations for select to anon, authenticated
  using (exists (select 1 from public.quiz_answers a where a.id = answer_id));
create policy quiz_answer_translations_write on public.quiz_answer_translations for all to authenticated
  using (exists (select 1 from public.quiz_answers a join public.quizzes q on q.id = a.quiz_id
                 where a.id = answer_id and public.can_edit_park(q.park_id)))
  with check (exists (select 1 from public.quiz_answers a join public.quizzes q on q.id = a.quiz_id
                 where a.id = answer_id and public.can_edit_park(q.park_id)));

-- Tentatives : lecture propriétaire (+ admin du parc pour analytics). Écriture : fonction serveur.
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_admin_park(q.park_id))
  );

-- ---------------------------------------------------------------------------
-- Défis
-- ---------------------------------------------------------------------------

create policy challenges_select on public.challenges for select to anon, authenticated
  using (public.can_read_content(park_id, status));
create policy challenges_write on public.challenges for all to authenticated
  using (public.can_edit_park(park_id)) with check (public.can_edit_park(park_id));

create policy challenge_translations_select on public.challenge_translations for select to anon, authenticated
  using (exists (select 1 from public.challenges c where c.id = challenge_id));
create policy challenge_translations_write on public.challenge_translations for all to authenticated
  using (exists (select 1 from public.challenges c where c.id = challenge_id and public.can_edit_park(c.park_id)))
  with check (exists (select 1 from public.challenges c where c.id = challenge_id and public.can_edit_park(c.park_id)));

create policy challenge_completions_select on public.challenge_completions for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.challenges c where c.id = challenge_id and public.can_moderate_park(c.park_id))
  );

-- ---------------------------------------------------------------------------
-- Visites, découvertes, points, badges : propriétaire uniquement, lecture seule.
-- La position d'un utilisateur n'est JAMAIS exposée à qui que ce soit.
-- ---------------------------------------------------------------------------

create policy visits_select_own on public.visits for select to authenticated
  using (user_id = (select auth.uid()));
create policy visit_spots_select_own on public.visit_spots for select to authenticated
  using (user_id = (select auth.uid()));
create policy point_transactions_select_own on public.point_transactions for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_badges_select_own on public.user_badges for select to authenticated
  using (user_id = (select auth.uid()));

create policy badges_select on public.badges for select to anon, authenticated
  using (park_id is null or public.is_park_public(park_id) or public.is_park_staff(park_id));
create policy badges_write on public.badges for all to authenticated
  using (case when park_id is null then public.is_platform_staff() else public.can_edit_park(park_id) end)
  with check (case when park_id is null then public.is_platform_staff() else public.can_edit_park(park_id) end);

create policy badge_translations_select on public.badge_translations for select to anon, authenticated
  using (exists (select 1 from public.badges b where b.id = badge_id));
create policy badge_translations_write on public.badge_translations for all to authenticated
  using (exists (select 1 from public.badges b where b.id = badge_id
    and case when b.park_id is null then public.is_platform_staff() else public.can_edit_park(b.park_id) end))
  with check (exists (select 1 from public.badges b where b.id = badge_id
    and case when b.park_id is null then public.is_platform_staff() else public.can_edit_park(b.park_id) end));

-- ---------------------------------------------------------------------------
-- Médias : photo utilisateur toujours PENDING à la création.
-- ---------------------------------------------------------------------------

create policy media_select on public.media for select to anon, authenticated
  using (
    (moderation_status = 'APPROVED' and public.is_park_public(park_id))
    or owner_id = (select auth.uid())
    or public.is_park_staff(park_id)
  );
create policy media_insert_user on public.media for insert to authenticated
  with check (
    (owner_id = (select auth.uid()) and moderation_status = 'PENDING' and public.is_park_public(park_id))
    or (owner_id is null and public.can_edit_park(park_id))
  );
create policy media_update_staff on public.media for update to authenticated
  using (public.can_moderate_park(park_id) or public.can_edit_park(park_id))
  with check (public.can_moderate_park(park_id) or public.can_edit_park(park_id));
create policy media_delete on public.media for delete to authenticated
  using (owner_id = (select auth.uid()) or public.can_moderate_park(park_id));

-- ---------------------------------------------------------------------------
-- Commentaires et signalements
-- ---------------------------------------------------------------------------

create policy comments_select on public.comments for select to anon, authenticated
  using (
    (moderation_status = 'APPROVED' and public.is_park_public(park_id))
    or author_id = (select auth.uid())
    or public.can_moderate_park(park_id)
  );
create policy comments_insert_own on public.comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and moderation_status = 'PENDING'
    and public.is_park_public(park_id)
  );
create policy comments_update_moderator on public.comments for update to authenticated
  using (public.can_moderate_park(park_id)) with check (public.can_moderate_park(park_id));
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = (select auth.uid()) or public.can_moderate_park(park_id));

create policy comment_reports_insert on public.comment_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and resolved_at is null);
create policy comment_reports_select on public.comment_reports for select to authenticated
  using (
    reporter_id = (select auth.uid())
    or exists (select 1 from public.comments c where c.id = comment_id and public.can_moderate_park(c.park_id))
  );
create policy comment_reports_update on public.comment_reports for update to authenticated
  using (exists (select 1 from public.comments c where c.id = comment_id and public.can_moderate_park(c.park_id)))
  with check (exists (select 1 from public.comments c where c.id = comment_id and public.can_moderate_park(c.park_id)));

-- ---------------------------------------------------------------------------
-- Favoris : propriétaire uniquement
-- ---------------------------------------------------------------------------

create policy user_favorites_own on public.user_favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------

create policy article_categories_select on public.article_categories for select to anon, authenticated
  using (true);
create policy article_categories_write on public.article_categories for all to authenticated
  using (public.is_platform_staff()) with check (public.is_platform_staff());

create policy articles_select on public.articles for select to anon, authenticated
  using (
    case when park_id is null
      then status = 'PUBLISHED' or public.is_platform_staff()
      else public.can_read_content(park_id, status)
    end
  );
create policy articles_write on public.articles for all to authenticated
  using (case when park_id is null then public.is_platform_staff() else public.can_edit_park(park_id) end)
  with check (case when park_id is null then public.is_platform_staff() else public.can_edit_park(park_id) end);

create policy article_translations_select on public.article_translations for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));
create policy article_translations_write on public.article_translations for all to authenticated
  using (exists (select 1 from public.articles a where a.id = article_id
    and case when a.park_id is null then public.is_platform_staff() else public.can_edit_park(a.park_id) end))
  with check (exists (select 1 from public.articles a where a.id = article_id
    and case when a.park_id is null then public.is_platform_staff() else public.can_edit_park(a.park_id) end));

-- ---------------------------------------------------------------------------
-- Les tables sans politique d'écriture (visits, visit_spots, point_transactions,
-- user_badges, quiz_attempts, challenge_completions) sont en lecture seule pour
-- anon/authenticated : seules les fonctions SECURITY DEFINER y écrivent.
-- ---------------------------------------------------------------------------
revoke insert, update, delete on
  public.visits, public.visit_spots, public.point_transactions,
  public.user_badges, public.quiz_attempts, public.challenge_completions
from anon, authenticated;
