-- Reels table
CREATE TABLE public.reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'video',
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reels are viewable by everyone" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Users can insert own reels" ON public.reels FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can delete own reels" ON public.reels FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Reel likes
CREATE TABLE public.reel_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (reel_id, profile_id)
);
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reel likes viewable by everyone" ON public.reel_likes FOR SELECT USING (true);
CREATE POLICY "Users can like reels" ON public.reel_likes FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can unlike reels" ON public.reel_likes FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Reels media public read" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Users upload own reel media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own reel media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);