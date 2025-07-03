
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Eye, X, Loader2, RotateCcw } from "lucide-react";
import { StoryStatusBadge } from "./StoryStatusBadge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface InProgressStoryCarouselProps {
  story: any;
  regeneratingPages: Set<string>;
  savingStory: boolean;
  cancellingStories: Set<string>;
  onRegenerate: (pageId: string, storyId: string, artStyle: string) => void;
  onSaveToLibrary: (story: any) => void;
  onPreview: (story: any) => void;
  onCancel: (storyId: string, storyTitle: string) => void;
}

export function InProgressStoryCarousel({
  story,
  regeneratingPages,
  savingStory,
  cancellingStories,
  onRegenerate,
  onSaveToLibrary,
  onPreview,
  onCancel
}: InProgressStoryCarouselProps) {
  const pages = story.story_pages || [];
  const completedPages = pages.filter(page => page.transformation_status === 'completed');

  return (
    <Card className="p-6">
      {/* Story Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            {story.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {story.total_pages || story.story_pages?.length || 0} pages • 
            <StoryStatusBadge status={story.status} className="ml-1" /> • 
            Created {new Date(story.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            {completedPages.length} of {pages.length} pages completed
          </p>
        </div>
        <div className="flex gap-2">
          {story.status === 'processing' && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onCancel(story.id, story.title)}
              disabled={cancellingStories.has(story.id)}
            >
              {cancellingStories.has(story.id) ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <X className="mr-1 h-3 w-3" />
              )}
              Cancel
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onPreview(story)}
            disabled={story.status === 'processing'}
          >
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Button>
        </div>
      </div>

      {/* Story Pages Carousel */}
      <Carousel className="w-full">
        <CarouselContent>
          {pages.map((page, index) => (
            <CarouselItem key={page.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card className="aspect-square">
                  <div className="relative h-full">
                    {/* Page Image */}
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-t-lg">
                      {page.generated_image_url ? (
                        <img
                          src={page.generated_image_url}
                          alt={`Page ${page.page_number}`}
                          className="max-w-full max-h-full object-contain rounded-t-lg"
                        />
                      ) : page.original_image_url ? (
                        <img
                          src={page.original_image_url}
                          alt={`Original Page ${page.page_number}`}
                          className="max-w-full max-h-full object-contain rounded-t-lg opacity-50"
                        />
                      ) : (
                        <div className="text-gray-400">
                          Page {page.page_number}
                        </div>
                      )}
                    </div>

                    {/* Regenerate Button */}
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onRegenerate(page.id, story.id, story.art_style)}
                        disabled={
                          regeneratingPages.has(page.id) || 
                          story.status === 'processing' ||
                          page.transformation_status !== 'completed'
                        }
                        className="bg-white/90 hover:bg-white shadow-sm"
                      >
                        {regeneratingPages.has(page.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    {/* Page Status */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        page.transformation_status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : page.transformation_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.transformation_status === 'completed' ? 'Done' : 
                         page.transformation_status === 'failed' ? 'Failed' : 'Processing'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* Save to Library Button */}
      <div className="mt-6 flex justify-center">
        <Button 
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
          onClick={() => onSaveToLibrary(story)}
          disabled={story.status === 'processing' || savingStory || completedPages.length === 0}
        >
          {savingStory ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save to Library
        </Button>
      </div>
    </Card>
  );
}
