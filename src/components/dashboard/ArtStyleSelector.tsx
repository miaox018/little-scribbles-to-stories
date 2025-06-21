
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const artStyles: ArtStyle[] = [
  {
    id: "classic_watercolor",
    name: "Classic Watercolor",
    description: "Soft, dreamy watercolor paintings with gentle colors",
    preview: "🎨"
  },
  {
    id: "disney_animation",
    name: "Disney-Style Animation",
    description: "Bright, colorful cartoon style reminiscent of Disney films",
    preview: "🏰"
  },
  {
    id: "realistic_digital",
    name: "Realistic Digital Art",
    description: "High-quality digital illustrations with realistic details",
    preview: "🖼️"
  },
  {
    id: "manga_anime",
    name: "Manga/Anime Style", 
    description: "Japanese-inspired art with expressive characters",
    preview: "🎭"
  },
  {
    id: "vintage_storybook",
    name: "Vintage Storybook",
    description: "Classic storybook illustrations with nostalgic charm",
    preview: "📚"
  }
];

interface ArtStyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  disabled?: boolean;
}

export function ArtStyleSelector({ selectedStyle, onStyleChange, disabled = false }: ArtStyleSelectorProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <Label className="text-base font-medium mb-4 block">
          Choose Art Style
        </Label>
        <p className="text-sm text-gray-600 mb-4">
          Select the artistic style you'd like for your transformed storybook
        </p>
        <RadioGroup
          value={selectedStyle}
          onValueChange={onStyleChange}
          disabled={disabled}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {artStyles.map((style) => (
            <div key={style.id}>
              <RadioGroupItem
                value={style.id}
                id={style.id}
                className="peer sr-only"
                disabled={disabled}
              />
              <Label
                htmlFor={style.id}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="text-3xl mb-2">{style.preview}</div>
                <div className="text-sm font-medium text-center">{style.name}</div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {style.description}
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
