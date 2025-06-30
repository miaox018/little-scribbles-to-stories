
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, X } from "lucide-react";

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
  const estimatedTimeRemaining = Math.max(0, ((100 - progress) / 100) * totalPages * 2); // 2 minutes per page estimate

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
              Processing {totalPages} pages...
            </span>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>{Math.round(progress)}% complete</span>
            <span>
              {estimatedTimeRemaining > 0 ? `~${Math.ceil(estimatedTimeRemaining)} minutes remaining` : "Almost done!"}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            We're analyzing your drawings and creating professional illustrations. This process may take a few minutes. 
            Feel free to grab a coffee and check back later!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
