
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Eye, X, Loader2 } from "lucide-react";
import { StoryPageGrid } from "./StoryPageGrid";
import { StoryStatusBadge } from "./StoryStatusBadge";
import { StoryExpirationWarning } from "../StoryExpirationWarning";
import { getStoryExpirationInfo } from "@/utils/storyExpiration";

interface StoryCardProps {
  story: any;
  regeneratingPages: Set<string>;
  savingStories: Set<string>;
  cancellingStories: Set<string>;
  onRegenerate: (pageId: string, storyId: string, artStyle: string) => void;
  onSaveToLibrary: (story: any) => void;
  onPreview: (story: any) => void;
  onCancel: (storyId: string, storyTitle: string) => void;
}

export function StoryCard({
  story,
  regeneratingPages,
  savingStories,
  cancellingStories,
  onRegenerate,
  onSaveToLibrary,
  onPreview,
  onCancel
}: StoryCardProps) {
  const expirationInfo = getStoryExpirationInfo(story.expires_at);

  return (
    <Card className="p-6">
      {/* Expiration Warning */}
      {(expirationInfo.isExpiring || expirationInfo.isExpired) && (
        <StoryExpirationWarning 
          expirationInfo={expirationInfo}
          onSaveToLibrary={() => onSaveToLibrary(story)}
          className="mb-4"
        />
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            {story.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {story.total_pages || story.story_pages?.length || 0} pages • 
            <StoryStatusBadge status={story.status} /> • 
            Created {new Date(story.created_at).toLocaleDateString()}
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
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => onSaveToLibrary(story)}
            disabled={story.status === 'processing' || savingStories.has(story.id)}
          >
            {savingStories.has(story.id) ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Save className="mr-1 h-3 w-3" />
            )}
            Save to Library
          </Button>
        </div>
      </div>

      <StoryPageGrid
        pages={story.story_pages || []}
        storyId={story.id}
        artStyle={story.art_style}
        regeneratingPages={regeneratingPages}
        onRegenerate={onRegenerate}
      />
    </Card>
  );
}
