
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";

interface StoryPageItemProps {
  page: any;
  storyId: string;
  artStyle: string;
  isRegenerating: boolean;
  onRegenerate: (pageId: string, storyId: string, artStyle: string) => void;
}

export function StoryPageItem({ page, storyId, artStyle, isRegenerating, onRegenerate }: StoryPageItemProps) {
  return (
    <div className="relative group">
      <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
        {page.generated_image_url ? (
          <img 
            src={page.generated_image_url}
            alt={`Page ${page.page_number}`}
            className="w-full h-full object-cover"
            style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}
          />
        ) : page.transformation_status === 'failed' ? (
          <div className="w-full h-full flex items-center justify-center bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
      
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {page.page_number}
      </div>

      {page.transformation_status === 'failed' && (
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
          onClick={() => onRegenerate(page.id, storyId, artStyle)}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}
