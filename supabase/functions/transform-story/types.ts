
export interface ImageData {
  url: string;
  dataUrl: string;
}

export interface ArtStylePrompts {
  [key: string]: string;
}

export interface MasterStoryContext {
  characterDescriptions: string;
  artStyleGuidelines: string;
  storyFlow: string;
}

export interface CreateMasterStoryAnalysisParams {
  images: ImageData[];
  stylePrompt: string;
  storyId: string;
  supabase: any;
}

export interface ProcessStoryPageParams {
  imageData: ImageData;
  pageNumber: number;
  storyId: string;
  userId: string;
  stylePrompt: string;
  masterContext: MasterStoryContext;
  supabase: any;
}
