-- ParkQuest — 1200 : buckets Supabase Storage.
--
-- park-media  : médias officiels (publics en lecture, écriture par les éditeurs via le serveur).
-- user-photos : photos utilisateurs, privées ; chemin imposé « <user_id>/<fichier> ».
--               Publication uniquement après modération (table media).
-- Le bloc est ignoré si le schéma storage n'existe pas (Postgres hors Supabase).

do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'storage schema absent — buckets ignorés';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('park-media', 'park-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('user-photos', 'user-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
  on conflict (id) do nothing;

  execute $p$
    create policy "user-photos: owner upload" on storage.objects for insert to authenticated
    with check (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  $p$;
  execute $p$
    create policy "user-photos: owner read" on storage.objects for select to authenticated
    using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  $p$;
  execute $p$
    create policy "user-photos: owner delete" on storage.objects for delete to authenticated
    using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  $p$;
end;
$$;
