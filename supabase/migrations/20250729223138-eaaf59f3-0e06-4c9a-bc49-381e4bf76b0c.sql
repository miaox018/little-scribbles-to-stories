-- Add expires_at column to stories table for auto-expiration tracking
ALTER TABLE public.stories 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create function to identify and clean up expired stories
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS TABLE(deleted_story_id UUID, deleted_pages_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  story_record RECORD;
  deleted_pages INTEGER;
  total_deleted INTEGER := 0;
BEGIN
  -- Find stories that are expired (older than 7 days and not saved)
  FOR story_record IN 
    SELECT id, title 
    FROM public.stories 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND status != 'saved'
  LOOP
    -- Count pages before deletion
    SELECT COUNT(*) INTO deleted_pages
    FROM public.story_pages 
    WHERE story_id = story_record.id;
    
    -- Delete story pages first (due to foreign key)
    DELETE FROM public.story_pages WHERE story_id = story_record.id;
    
    -- Delete the story
    DELETE FROM public.stories WHERE id = story_record.id;
    
    -- Log the cleanup
    RAISE NOTICE 'Cleaned up expired story: % (% pages)', story_record.title, deleted_pages;
    
    -- Return the cleanup info
    deleted_story_id := story_record.id;
    deleted_pages_count := deleted_pages;
    total_deleted := total_deleted + 1;
    
    RETURN NEXT;
  END LOOP;
  
  RAISE NOTICE 'Total expired stories cleaned up: %', total_deleted;
END;
$$;

-- Create function to set expiration date for new stories
CREATE OR REPLACE FUNCTION public.set_story_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expiration to 7 days from creation for new non-saved stories
  IF NEW.status != 'saved' AND NEW.expires_at IS NULL THEN
    NEW.expires_at = NEW.created_at + INTERVAL '7 days';
  END IF;
  
  -- Clear expiration when story is saved
  IF NEW.status = 'saved' THEN
    NEW.expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set expiration on story creation/update
CREATE TRIGGER set_story_expiration_trigger
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_story_expiration();