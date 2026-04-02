-- Tighten comments INSERT policy: only authenticated users can insert their own comments
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert own comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- Tighten comments UPDATE policy: only owner can update
DROP POLICY IF EXISTS "Anyone can update comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Tighten likes INSERT policy: only authenticated users can insert their own likes
DROP POLICY IF EXISTS "Anyone can insert likes" ON public.likes;
CREATE POLICY "Authenticated users can insert own likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- Tighten likes DELETE policy: only owner can delete their likes
DROP POLICY IF EXISTS "Anyone can delete likes" ON public.likes;
CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);