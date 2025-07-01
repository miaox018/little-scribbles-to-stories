
export interface TransformationState {
  isTransforming: boolean;
  transformedStory: any | null;
  error: string | null;
  progress: number;
}

export interface TransformStoryParams {
  title: string;
  images: File[];
  artStyle: string;
}

export interface ImageUrlData {
  storageUrl: string;
  pageNumber: number;
}
