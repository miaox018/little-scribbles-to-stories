
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface StoryTitleInputProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export function StoryTitleInput({ title, onTitleChange }: StoryTitleInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="title">Story Title</Label>
      <Input
        id="title"
        placeholder="Enter your story title..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="text-lg"
      />
    </div>
  );
}
