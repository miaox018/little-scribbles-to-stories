
// Phase 3: Advanced Background Processing with Intelligent Batching

import { artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';
import { ErrorHandler, StoryProcessingError } from './error-handler.ts';

export interface BatchConfig {
  batchSize: number;
  concurrentBatches: number;
  delayBetweenBatches: number;
  maxRetries: number;
}

export class IntelligentBatchProcessor {
  private static readonly DEFAULT_CONFIG: BatchConfig = {
    batchSize: 2, // Process 2 pages at a time
    concurrentBatches: 1, // One batch at a time initially
    delayBetweenBatches: 3000, // 3 seconds between batches
    maxRetries: 3
  };
  
  private config: BatchConfig;
  private processedCount = 0;
  private failedCount = 0;
  private startTime = Date.now();
  
  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...IntelligentBatchProcessor.DEFAULT_CONFIG, ...config };
    console.log('[BATCH-PROCESSOR] Phase 3: Initialized with config:', this.config);
  }
  
  async processBatches(
    storyId: string,
    imageUrls: any[],
    artStyle: string,
    userId: string,
    supabase: any
  ): Promise<{ successfulPages: number; failedPages: number }> {
    console.log(`[BATCH-PROCESSOR] Phase 3: Starting intelligent batch processing for ${imageUrls.length} images`);
    
    const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
    let characterDescriptions = "";
    let artStyleGuidelines = "";
    
    // Create batches
    const batches = this.createBatches(imageUrls);
    console.log(`[BATCH-PROCESSOR] Created ${batches.length} batches of size ${this.config.batchSize}`);
    
    // Process batches sequentially with adaptive timing
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchNumber = batchIndex + 1;
      
      try {
        console.log(`[BATCH-PROCESSOR] Processing batch ${batchNumber}/${batches.length} (${batch.length} pages)`);
        
        // Check for cancellation before each batch
        const { data: story } = await supabase
          .from('stories')
          .select('status')
          .eq('id', storyId)
          .single();
        
        if (story?.status === 'cancelled') {
          console.log(`[BATCH-PROCESSOR] Story ${storyId} was cancelled, stopping batch processing`);
          break;
        }
        
        // Update progress
        const progressPercent = Math.round((batchIndex / batches.length) * 100);
        await supabase
          .from('stories')
          .update({ 
            description: `Processing batch ${batchNumber}/${batches.length} (${progressPercent}%)`,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId);
        
        // Process current batch
        const batchResults = await this.processBatch(
          batch,
          storyId,
          userId,
          stylePrompt,
          characterDescriptions,
          artStyleGuidelines,
          supabase
        );
        
        this.processedCount += batchResults.successful;
        this.failedCount += batchResults.failed;
        
        // Update context after first batch
        if (batchIndex === 0 && batchResults.successful > 0) {
          characterDescriptions = `- Character designs and appearances established in first pages
- Clothing styles and color schemes from initial pages`;
          artStyleGuidelines = `- Art style: ${stylePrompt}
- Visual language and composition style from first pages
- Text typography and placement style from first pages
- Portrait orientation (3:4 aspect ratio) with safe margins`;
        }
        
        // Adaptive delay between batches based on success rate
        if (batchIndex < batches.length - 1) {
          const delay = this.calculateAdaptiveDelay(batchResults);
          console.log(`[BATCH-PROCESSOR] Waiting ${delay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`[BATCH-PROCESSOR] Batch ${batchNumber} failed:`, error);
        this.failedCount += batch.length;
      }
    }
    
    const totalTime = Date.now() - this.startTime;
    console.log(`[BATCH-PROCESSOR] Phase 3: Completed batch processing in ${totalTime}ms`, {
      successful: this.processedCount,
      failed: this.failedCount,
      total: imageUrls.length
    });
    
    return {
      successfulPages: this.processedCount,
      failedPages: this.failedCount
    };
  }
  
  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize));
    }
    return batches;
  }
  
  private async processBatch(
    batch: any[],
    storyId: string,
    userId: string,
    stylePrompt: string,
    characterDescriptions: string,
    artStyleGuidelines: string,
    supabase: any
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;
    
    // Process pages in the batch concurrently (but limited)
    const promises = batch.map(async (imageData, index) => {
      const pageNumber = imageData.pageNumber || (index + 1);
      
      try {
        await processStoryPage({
          imageData,
          pageNumber,
          storyId,
          userId,
          stylePrompt,
          characterDescriptions,
          artStyleGuidelines,
          supabase
        });
        successful++;
        console.log(`[BATCH-PROCESSOR] ✅ Page ${pageNumber} completed successfully`);
      } catch (error) {
        failed++;
        console.error(`[BATCH-PROCESSOR] ❌ Page ${pageNumber} failed:`, error);
      }
    });
    
    await Promise.all(promises);
    
    return { successful, failed };
  }
  
  private calculateAdaptiveDelay(batchResults: { successful: number; failed: number }): number {
    const totalInBatch = batchResults.successful + batchResults.failed;
    const successRate = batchResults.successful / totalInBatch;
    
    // Reduce delay if success rate is high, increase if low
    if (successRate >= 0.8) {
      return Math.max(this.config.delayBetweenBatches * 0.5, 1000); // Minimum 1 second
    } else if (successRate >= 0.5) {
      return this.config.delayBetweenBatches;
    } else {
      return this.config.delayBetweenBatches * 2; // Double delay for poor success rate
    }
  }
}
