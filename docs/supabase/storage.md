# Supabase Storage — `club-images`

ClubZer stores club photos in a Supabase Storage bucket named **`club-images`**.

## Bucket configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Public | Yes | Images are served via public URLs on club cards |
| Max upload size | 5 MB | Enforced in `app/api/clubs/upload-image/route.ts` |
| Allowed types | JPEG, PNG, WebP, GIF | MIME type and magic-byte validated server-side |
| Object path | `{userId}/{timestamp}-{filename}` | Scoped per authenticated user |

## Recommended storage policies

Apply in the Supabase dashboard (Storage → `club-images` → Policies) or via SQL:

```sql
-- Authenticated users may upload to their own folder only
create policy "Users upload own club images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'club-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for club images (public bucket)
create policy "Public read club images"
on storage.objects for select
to public
using (bucket_id = 'club-images');

-- Users may delete objects in their own folder
create policy "Users delete own club images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'club-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

## Application controls

- Uploads require authentication (`requireAuth()`).
- Rate limit: 20 uploads per user per hour.
- Upload route validates file magic bytes before storage write.
- Club image URLs should only be saved on clubs the user owns or manages (enforced when saving club records).

## Operational notes

- Rotate compromised images by deleting objects in Supabase Storage and clearing `imageUrl` on affected clubs.
- Prefer keeping the bucket public only for club marketing images; do not store child photos in this bucket.
