
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  hidden_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update comments" ON public.comments FOR UPDATE USING (true);

-- Create likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, profile_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert likes" ON public.likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete likes" ON public.likes FOR DELETE USING (true);

-- Seed profiles
INSERT INTO public.profiles (id, username, display_name, avatar_url, bio) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'sarah_designs', 'Sarah Chen', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', 'UI/UX Designer ✨ Coffee lover ☕'),
  ('b2222222-2222-2222-2222-222222222222', 'alex_captures', 'Alex Rivera', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', 'Photographer 📸 Exploring the world'),
  ('c3333333-3333-3333-3333-333333333333', 'foodie_emma', 'Emma Wilson', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', 'Food blogger 🍕 Recipe creator 👩‍🍳'),
  ('d4444444-4444-4444-4444-444444444444', 'tech_raj', 'Raj Patel', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', 'Full-stack dev 💻 Open source contributor'),
  ('e5555555-5555-5555-5555-555555555555', 'maya_art', 'Maya Johnson', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', 'Digital artist 🎨 Dreamer');

-- Seed posts
INSERT INTO public.posts (profile_id, image_url, caption) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=600&fit=crop', 'New workspace setup! Ready to create 💻✨'),
  ('a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=600&fit=crop', 'Golden hour at the coast 🌅'),
  ('b2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=600&fit=crop', 'Mountains calling 🏔️ #nature #photography'),
  ('b2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=600&fit=crop', 'Foggy morning in the forest 🌲'),
  ('c3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop', 'Homemade pizza night 🍕 Recipe in bio!'),
  ('c3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop', 'Colorful salad bowl 🥗 Eating the rainbow'),
  ('d4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=600&fit=crop', 'Late night coding session 🌙 Building something cool'),
  ('d4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=600&fit=crop', 'Clean code, clean mind 🧘‍♂️'),
  ('e5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop', 'Latest digital painting 🎨 What do you think?'),
  ('e5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=600&fit=crop', 'Color explosion 💥 #art #digital');

-- Seed some comments
INSERT INTO public.comments (post_id, profile_id, content) 
SELECT p.id, 'b2222222-2222-2222-2222-222222222222', 'This looks amazing! 🔥'
FROM public.posts p WHERE p.caption LIKE '%workspace%' LIMIT 1;

INSERT INTO public.comments (post_id, profile_id, content)
SELECT p.id, 'c3333333-3333-3333-3333-333333333333', 'Beautiful shot! Where is this?'
FROM public.posts p WHERE p.caption LIKE '%Mountains%' LIMIT 1;

INSERT INTO public.comments (post_id, profile_id, content)
SELECT p.id, 'a1111111-1111-1111-1111-111111111111', 'That looks so delicious! 😍'
FROM public.posts p WHERE p.caption LIKE '%pizza%' LIMIT 1;

INSERT INTO public.comments (post_id, profile_id, content)
SELECT p.id, 'd4444444-4444-4444-4444-444444444444', 'Incredible artwork Maya! 🎨'
FROM public.posts p WHERE p.caption LIKE '%digital painting%' LIMIT 1;
