
import { StoryPageItem } from "./StoryPageItem";

interface StoryPageGridProps {
  pages: any[];
  storyId: string;
  artStyle: string;
  regeneratingPages: Set<string>;
  onRegenerate: (pageId: string, storyId: string, artStyle: string) => void;
}

export function StoryPageGrid({ pages, storyId, artStyle, regeneratingPages, onRegenerate }: StoryPageGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {pages
        .sort((a: any, b: any) => a.page_number - b.page_number)
        .map((page: any) => (
          <StoryPageItem
            key={page.id}
            page={page}
            storyId={storyId}
            artStyle={artStyle}
            isRegenerating={regeneratingPages.has(page.id)}
            onRegenerate={onRegenerate}
          />
        ))}
    </div>
  );
}
