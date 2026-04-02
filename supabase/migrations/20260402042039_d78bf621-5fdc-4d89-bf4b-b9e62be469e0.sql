-- Fix 1: Replace public SELECT on comments to hide moderated content from non-admins
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

-- Non-admin users can only see non-hidden comments
CREATE POLICY "Public can view non-hidden comments"
  ON public.comments FOR SELECT
  TO public
  USING (is_hidden = false);

-- Admins can see all comments (including hidden ones)
CREATE POLICY "Admins can view all comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Comment authors can see their own comments (even if hidden)
CREATE POLICY "Users can view own comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

-- Fix 2: Add DELETE policy for comments
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);