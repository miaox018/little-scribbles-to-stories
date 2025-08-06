import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJobQueue, type StoryJob } from "@/hooks/useJobQueue";
import { X, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface JobProgressProps {
  onJobComplete?: (storyId: string) => void;
}

export function JobProgress({ onJobComplete }: JobProgressProps) {
  const { jobs, cancelJob, refreshJobs } = useJobQueue();

  const getStatusIcon = (status: StoryJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: StoryJob['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.job_id} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(job.status)}
                {job.story_title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(job.status) as any}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
                {(job.status === 'pending' || job.status === 'processing') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelJob(job.job_id)}
                    className="h-8 px-3"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{job.progress_percentage}%</span>
              </div>
              <Progress value={job.progress_percentage} className="h-2" />
            </div>

            {/* Page Progress */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Page {job.current_page} of {job.total_pages}
              </span>
              <span>
                Started {new Date(job.created_at).toLocaleTimeString()}
              </span>
            </div>

            {/* Error Message */}
            {job.error_message && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{job.error_message}</p>
              </div>
            )}

            {/* Status-specific content */}
            {job.status === 'completed' && onJobComplete && (
              <div className="pt-2">
                <Button 
                  onClick={() => onJobComplete(job.story_id)}
                  className="w-full"
                  variant="outline"
                >
                  View Completed Story
                </Button>
              </div>
            )}

            {job.status === 'processing' && (
              <div className="text-sm text-muted-foreground">
                <p>✨ Analyzing your drawings with GPT-4o...</p>
                <p>🎨 Creating beautiful illustrations with GPT-Image-1...</p>
                <p>📚 Building character consistency across pages...</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}