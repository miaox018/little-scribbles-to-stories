
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
            <span className={`text-xs px-2 py-1 rounded-full ${
              currentStoryPage.transformation_status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : currentStoryPage.transformation_status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {currentStoryPage.transformation_status}
            </span>
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
