
create policy "project-info read auth"
on storage.objects for select to authenticated
using (bucket_id = 'project-info');

create policy "project-info insert auth"
on storage.objects for insert to authenticated
with check (bucket_id = 'project-info' and owner = auth.uid());

create policy "project-info update own"
on storage.objects for update to authenticated
using (bucket_id = 'project-info' and owner = auth.uid())
with check (bucket_id = 'project-info' and owner = auth.uid());

create policy "project-info delete own"
on storage.objects for delete to authenticated
using (bucket_id = 'project-info' and owner = auth.uid());
