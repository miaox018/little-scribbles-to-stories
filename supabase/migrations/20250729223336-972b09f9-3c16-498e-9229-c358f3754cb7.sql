-- Enable the pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension for HTTP requests  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cleanup to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-expired-stories-daily',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://mpmbduoffaldnkhrkxxp.supabase.co/functions/v1/cleanup-expired-stories',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWJkdW9mZmFsZG5raHJreHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTc1MDQsImV4cCI6MjA2NjA5MzUwNH0.A2lEnoCvxL8ehRGCwkLtLdHVvB33AlM0oU9NG79EFyE"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);