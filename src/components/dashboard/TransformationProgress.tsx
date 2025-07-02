
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, X, Clock, CheckCircle } from "lucide-react";

interface TransformationProgressProps {
  progress: number;
  storyTitle: string;
  totalPages: number;
  onCancel?: () => void;
}

export function TransformationProgress({
  progress,
  storyTitle,
  totalPages,
  onCancel
}: TransformationProgressProps) {
  const isLargeStory = totalPages > 3;
  const estimatedTimeRemaining = Math.max(0, ((100 - progress) / 100) * totalPages * 2); // 2 minutes per page estimate
  const processingMode = isLargeStory ? "Background Processing" : "Quick Processing";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transforming "{storyTitle}"</h3>
          {onCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel} 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-sm">
              {processingMode}: {totalPages} pages...
            </span>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>{Math.round(progress)}% complete</span>
            <span>
              {estimatedTimeRemaining > 0 ? `~${Math.ceil(estimatedTimeRemaining)} minutes remaining` : "Almost done!"}
            </span>
          </div>
          
          {isLargeStory ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Background Processing Active
                  </p>
                  <p className="text-xs text-blue-600 mb-2">
                    Your {totalPages}-page story is being processed in the background. 
                    This will take approximately {Math.ceil(totalPages * 20 / 60)} minutes.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <CheckCircle className="h-3 w-3" />
                    <span>You can safely close this page and check back later</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-700 mt-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Progress updates in "Stories In Progress" section</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center">
              We're analyzing your drawings and creating professional illustrations. 
              This should only take a minute or two!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
