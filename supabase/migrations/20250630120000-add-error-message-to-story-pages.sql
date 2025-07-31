-- Add error_message column to story_pages table for better error telemetry
-- This supports improvement E: Better error telemetry

ALTER TABLE story_pages 
ADD COLUMN IF NOT EXISTS error_message TEXT; 