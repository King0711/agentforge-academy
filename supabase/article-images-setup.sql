-- Admin uploads for article and guide header images.
--
-- The `news-images` bucket predates this file: generate-news-digest has
-- always written to it, but through service_role, which bypasses RLS
-- entirely. Nothing granted a *browser* session write access, so the upload
-- control in src/components/admin/ImageUploadField.jsx would have been
-- refused. These policies close that gap, restricted to admins.
--
-- Reads need no policy — the bucket is public, so its objects are served
-- through the public storage endpoint without consulting RLS. Everything
-- below is about writes.
--
-- Idempotent: safe to re-run.

-- 1. Bucket limits.
--
-- Both were null, which was tolerable while only service_role could write.
-- Once a browser can upload, an unbounded bucket accepts a 200MB video or
-- an .exe renamed to .jpg. The client checks the same two constraints up
-- front (see imageRejectionReason) so a bad file fails with a readable
-- message rather than a raw storage error, but the bucket is the boundary
-- that actually enforces them.
update storage.buckets
set file_size_limit = 2097152, -- 2MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'news-images';

-- 2. Write policies, admin-only.
--
-- Same is_admin check as every admin_* RPC in admin-setup.sql. Note this
-- deliberately does NOT use a SECURITY DEFINER helper: policies on
-- storage.objects run as the calling role, and the entitlements select
-- below is already permitted by that table's own RLS for the row belonging
-- to auth.uid().

drop policy if exists "Admins can upload article images" on storage.objects;
create policy "Admins can upload article images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'news-images'
  and exists (
    select 1 from public.entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true
  )
);

-- Needed for upsert, and for replacing a file at a path that already
-- exists. The upload control writes a unique path per upload so it does not
-- normally take this route, but the pipeline's upsert:true does.
drop policy if exists "Admins can replace article images" on storage.objects;
create policy "Admins can replace article images"
on storage.objects for update to authenticated
using (
  bucket_id = 'news-images'
  and exists (
    select 1 from public.entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true
  )
)
with check (
  bucket_id = 'news-images'
  and exists (
    select 1 from public.entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true
  )
);

-- Uploads use a unique path each time (storagePathFor appends a timestamp)
-- so that a one-year immutable Cache-Control never serves a stale image.
-- The tradeoff is that replaced images accumulate; this lets an admin prune
-- them from the Supabase dashboard rather than leaving it to service_role.
drop policy if exists "Admins can delete article images" on storage.objects;
create policy "Admins can delete article images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'news-images'
  and exists (
    select 1 from public.entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true
  )
);
