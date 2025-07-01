
export interface ImageUrlData {
  storageUrl: string;
  pageNumber: number;
}

export interface ArtStylePrompts {
  [key: string]: string;
}

export interface ProcessStoryPageParams {
  imageData: ImageUrlData;
  pageNumber: number;
  storyId: string;
  userId: string;
  stylePrompt: string;
  characterDescriptions: string;
  artStyleGuidelines: string;
  supabase: any;
}
