// Transform Story 模块的类型定义

export interface ProcessStoryPageParams {
  imageData: {
    storageUrl: string;
  };
  pageNumber: number;
  storyId: string;
  userId: string;
  stylePrompt: string;
  characterDescriptions?: string;
  artStyleGuidelines?: string;
  supabase: any; // Supabase client instance
}

export interface StoryPageResult {
  analysisText: string;
  generatedImageUrl: string;
  originalImageUrl: string;
  characterDescriptions?: string;
}

export interface StoryPageError {
  error: string;
  pageNumber: number;
}

export interface BatchProcessResult {
  success: boolean;
  status: 'completed' | 'partial' | 'failed';
  processedPages: number;
  totalPages: number;
  results: (StoryPageResult | StoryPageError)[];
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  extractedCharacters?: string[];
}

export interface CharacterDescription {
  name: string;
  appearance: string;
  clothing: string;
  colorPalette: string;
  personality?: string;
}

export interface ArtStyle {
  name: string;
  prompt: string;
  description: string;
} 