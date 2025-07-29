
-- Complete reset: Delete all story-related data and clear storage
-- This will NOT affect profiles, subscribers, user_roles, coupon_codes, or coupon_redemptions

-- Step 1: Delete all story pages (should be empty but just in case)
DELETE FROM public.story_pages;

-- Step 2: Delete all stories
DELETE FROM public.stories;

-- Step 3: Clear usage tracking data
DELETE FROM public.usage_tracking;

-- Step 4: Clear monthly usage data
DELETE FROM public.monthly_usage;

-- Step 5: Clear all files from the story-images storage bucket
DELETE FROM storage.objects WHERE bucket_id = 'story-images';

-- Verify the cleanup
SELECT 
  (SELECT COUNT(*) FROM public.stories) as stories_remaining,
  (SELECT COUNT(*) FROM public.story_pages) as story_pages_remaining,
  (SELECT COUNT(*) FROM public.usage_tracking) as usage_tracking_remaining,
  (SELECT COUNT(*) FROM public.monthly_usage) as monthly_usage_remaining,
  (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'story-images') as storage_files_remaining;
