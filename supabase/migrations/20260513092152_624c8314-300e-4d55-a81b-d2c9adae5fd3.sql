
ALTER TABLE public.comments ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS reel_id uuid;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_post_or_reel_chk
  CHECK ((post_id IS NOT NULL)::int + (reel_id IS NOT NULL)::int = 1);
CREATE INDEX IF NOT EXISTS idx_comments_reel_id ON public.comments(reel_id);
