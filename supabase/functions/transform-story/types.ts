
export interface ImageData {
  url: string;
  dataUrl: string;
}

export interface ArtStylePrompts {
  [key: string]: string;
}

export interface ProcessStoryPageParams {
  imageData: ImageData;
  pageNumber: number;
  storyId: string;
  userId: string;
  stylePrompt: string;
  characterDescriptions: string;
  artStyleGuidelines: string;
  supabase: any;
}
