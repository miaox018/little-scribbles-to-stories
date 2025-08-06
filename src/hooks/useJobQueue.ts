import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StoryJob {
  job_id: string;
  story_id: string;
  story_title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;
  current_page: number;
  total_pages: number;
  created_at: string;
  error_message?: string;
}

export const useJobQueue = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<StoryJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch active jobs
  const fetchActiveJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_user_active_jobs', {
        user_id_param: user.id
      });

      if (error) {
        console.error('Error fetching active jobs:', error);
        return;
      }

      setJobs((data || []) as StoryJob[]);
    } catch (error) {
      console.error('Error in fetchActiveJobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Create a new job
  const createJob = useCallback(async (
    storyId: string, 
    totalPages: number, 
    jobType: 'full_story' | 'single_page' | 'character_sheet' = 'full_story'
  ) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('story_processing_jobs')
      .insert({
        story_id: storyId,
        user_id: user.id,
        job_type: jobType,
        total_pages: totalPages,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Refresh jobs list
    await fetchActiveJobs();
    
    return data;
  }, [user?.id, fetchActiveJobs]);

  // Update job progress
  const updateJobProgress = useCallback(async (
    jobId: string, 
    progress: number, 
    currentPage?: number, 
    status?: string
  ) => {
    const updates: any = { progress_percentage: progress };
    if (currentPage !== undefined) updates.current_page = currentPage;
    if (status) updates.status = status;

    const { error } = await supabase
      .from('story_processing_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job progress:', error);
      throw error;
    }
  }, []);

  // Cancel a job
  const cancelJob = useCallback(async (jobId: string) => {
    const { error } = await supabase
      .from('story_processing_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId);

    if (error) throw error;
    await fetchActiveJobs();
  }, [fetchActiveJobs]);

  // Set up realtime subscription for job updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_processing_jobs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Job update received:', payload);
          fetchActiveJobs();
        }
      )
      .subscribe();

    // Initial fetch
    fetchActiveJobs();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchActiveJobs]);

  return {
    jobs,
    isLoading,
    createJob,
    updateJobProgress,
    cancelJob,
    refreshJobs: fetchActiveJobs
  };
};