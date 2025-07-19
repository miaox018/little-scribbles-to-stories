import { IntelligentBatchProcessor } from './batch-processor.ts';

// Enhanced background processing function with Phase 3 optimizations
export async function processStoryAsync(storyId: string, imageUrls: any[], artStyle: string, userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`[ASYNC] Phase 3: Starting enhanced batch processing for story ${storyId} with ${imageUrls.length} images`);
  
  try {
    // Mark story as actively processing
    await supabase
      .from('stories')
      .update({ 
        status: 'processing',
        description: `Phase 3: Initializing intelligent batch processing for ${imageUrls.length} pages...`,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    // Phase 3: Use intelligent batch processor
    const batchProcessor = new IntelligentBatchProcessor({
      batchSize: imageUrls.length <= 5 ? 1 : 2, // Smaller batches for smaller stories
      delayBetweenBatches: 2000 // Reduced delay from Phase 1
    });
    
    const results = await batchProcessor.processBatches(
      storyId,
      imageUrls,
      artStyle,
      userId,
      supabase
    );
    
    const { successfulPages, failedPages } = results;

    // Determine final status based on results
    let finalStatus = 'completed';
    let finalDescription = '';
    
    if (failedPages > 0 && successfulPages > 0) {
      finalStatus = 'partial';
      finalDescription = `Story partially completed: ${successfulPages} successful, ${failedPages} failed pages. You can regenerate the failed pages.`;
    } else if (successfulPages === 0) {
      finalStatus = 'failed';
      finalDescription = `Story processing failed: All ${failedPages} pages failed to process.`;
    } else {
      finalDescription = `Story completed successfully with ${successfulPages} pages using Phase 3 optimizations.`;
    }

    // Update final story status
    console.log(`[ASYNC] Phase 3: Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);
    await supabase
      .from('stories')
      .update({ 
        status: finalStatus,
        total_pages: imageUrls.length,
        description: finalDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

  } catch (error) {
    console.error(`[ASYNC] Phase 3: Critical error in batch processing for story ${storyId}:`, error);
    
    // Update story status to failed with error details
    await supabase
      .from('stories')
      .update({ 
        status: 'failed',
        description: `Phase 3 processing failed: ${error.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);
  }
}

// Enhanced page processing with retry logic
async function processStoryPageWithRetry(params: any, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[RETRY] Attempting page ${params.pageNumber} - retry ${attempt}/${maxRetries}`);
        // Phase 1 optimization: Faster exponential backoff (1s base instead of 2s)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      return await processStoryPage(params);
    } catch (error) {
      lastError = error;
      console.error(`[RETRY] Page ${params.pageNumber} attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
}

export async function startAsyncProcessing(storyId: string, imageUrls: any[], artStyle: string, userId: string, supabase: any) {
  console.log(`[ASYNC] Phase 3: Starting intelligent batch processing for ${imageUrls.length} images asynchronously`);
  
  // Update story status to processing
  await supabase
    .from('stories')
    .update({ 
      status: 'processing',
      total_pages: imageUrls.length,
      description: `Phase 3: Initializing intelligent background processing for ${imageUrls.length} pages...`,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);

  // Use EdgeRuntime.waitUntil for proper background processing
  try {
    EdgeRuntime.waitUntil(processStoryAsync(storyId, imageUrls, artStyle, userId));
  } catch (error) {
    // Fallback to setTimeout if EdgeRuntime is not available
    console.log('[ASYNC] EdgeRuntime not available, using setTimeout fallback');
    setTimeout(() => {
      processStoryAsync(storyId, imageUrls, artStyle, userId);
    }, 100);
  }

  // Return immediately with enhanced response
  return {
    success: true, 
    message: `Phase 3 intelligent batch processing started for ${imageUrls.length} pages. Advanced error handling and recovery systems are active.`,
    pages_to_process: imageUrls.length,
    estimated_completion_time: `${Math.ceil(imageUrls.length * 4 / 60)} minutes`, // Phase 3: Further reduced estimate
    status: 'processing',
    processing_mode: 'intelligent_batch_async',
    phase: 3,
    features: [
      'Intelligent batch processing',
      'Enhanced error handling & recovery',
      'Circuit breaker protection',
      'Adaptive timing based on success rates',
      'Comprehensive logging and monitoring'
    ],
    instructions: 'Check your "Stories In Progress" section for real-time updates. The story will automatically complete in the background with advanced error recovery.',
    recovery_info: 'Phase 3 includes automatic error recovery, retry mechanisms, and circuit breaker protection for maximum reliability.'
  };
}
