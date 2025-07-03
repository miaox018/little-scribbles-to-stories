
import { StoryStatusBadge } from "../in-progress-stories/StoryStatusBadge";

interface CarouselFooterProps {
  currentPage: number;
  totalPages: number;
  pages: any[];
  currentStoryPage?: any;
  onPageSelect: (index: number) => void;
}

export function CarouselFooter({ 
  currentPage, 
  totalPages, 
  pages, 
  currentStoryPage, 
  onPageSelect 
}: CarouselFooterProps) {
  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          {currentStoryPage?.transformation_status && (
            <StoryStatusBadge status={currentStoryPage.transformation_status} className="text-xs" />
          )}
        </div>
        
        {/* Page Navigation Dots */}
        {totalPages > 1 && (
          <div className="flex gap-1">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => onPageSelect(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentPage ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
