
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create stories table to store user stories
CREATE TABLE public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_pages table to store individual pages
CREATE TABLE public.story_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  original_image_url TEXT,
  generated_image_url TEXT,
  user_feedback TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, page_number)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies for stories table
CREATE POLICY "Users can view own stories" ON public.stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for story_pages table
CREATE POLICY "Users can view own story pages" ON public.story_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own story pages" ON public.story_pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own story pages" ON public.story_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own story pages" ON public.story_pages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
