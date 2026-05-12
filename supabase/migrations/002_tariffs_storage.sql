-- Bucket privé pour stocker les PDF de tarifs uploadés par les garagistes.
-- Convention de chemin : {garage_id}/{timestamp}.pdf
insert into storage.buckets (id, name, public)
values ('tariffs', 'tariffs', false)
on conflict (id) do nothing;

create policy "tariffs: lecture propriétaire"
  on storage.objects for select
  using (
    bucket_id = 'tariffs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "tariffs: upload propriétaire"
  on storage.objects for insert
  with check (
    bucket_id = 'tariffs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "tariffs: suppression propriétaire"
  on storage.objects for delete
  using (
    bucket_id = 'tariffs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
