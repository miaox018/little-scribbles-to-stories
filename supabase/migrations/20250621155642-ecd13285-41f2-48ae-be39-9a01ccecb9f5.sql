
-- Create storage bucket for uploaded images
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-images', 'story-images', true);

-- Create storage policies for story images
CREATE POLICY "Users can upload story images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'story-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view story images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'story-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete story images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'story-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update stories table to include more fields
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 0;

-- Update story_pages table to include enhanced fields
ALTER TABLE public.story_pages 
ADD COLUMN IF NOT EXISTS enhanced_prompt TEXT,
ADD COLUMN IF NOT EXISTS transformation_status TEXT DEFAULT 'pending' CHECK (transformation_status IN ('pending', 'processing', 'completed', 'failed'));
