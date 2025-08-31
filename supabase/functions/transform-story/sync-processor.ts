
import { artStylePrompts } from './config.ts';
import { processStoryPage } from './story-processor.ts';

export async function processSynchronously(
  storyId: string, 
  imageUrls: any[], 
  artStyle: string, 
  userId: string, 
  supabase: any
) {
  console.log(`[SYNC] Processing ${imageUrls.length} images synchronously with enhanced error handling`);
  
  // Update story status to processing
  await supabase
    .from('stories')
    .update({ 
      status: 'processing',
      total_pages: imageUrls.length,
      description: `Processing page 1 of ${imageUrls.length} (synchronous mode)...`,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);

  const stylePrompt = artStylePrompts[artStyle as keyof typeof artStylePrompts] || artStylePrompts.classic_watercolor;
  let characterDescriptions = "";
  let artStyleGuidelines = "";
  let page1Analysis = ""; // Store analysis from page 1 for character consistency
  let successfulPages = 0;
  let failedPages = 0;

  // Process each image with enhanced error handling
  for (let i = 0; i < imageUrls.length; i++) {
    const currentPage = i + 1;
    
    try {
      // Check if story was cancelled during processing
      const { data: currentStory } = await supabase
        .from('stories')
        .select('status')
        .eq('id', storyId)
        .single();

      if (currentStory?.status === 'cancelled') {
        console.log(`[SYNC] Story ${storyId} was cancelled, stopping processing at page ${currentPage}`);
        return {
          success: false, 
          message: 'Story transformation was cancelled',
          cancelled: true
        };
      }

      // Update progress with detailed status
      const progressPercent = Math.round((i / imageUrls.length) * 100);
      await supabase
        .from('stories')
        .update({ 
          description: `Processing page ${currentPage} of ${imageUrls.length} (${progressPercent}%)`,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      console.log(`[SYNC] Processing page ${currentPage} of ${imageUrls.length}`);
      
      // Process with timeout protection
      const result = await Promise.race([
        processStoryPage({
          imageData: imageUrls[i], 
          pageNumber: currentPage, 
          storyId, 
          userId,
          stylePrompt,
          characterDescriptions,
          artStyleGuidelines,
          supabase
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Page processing timeout')), 120000) // 2 minute timeout per page
        )
      ]);

      successfulPages++;

      // Extract character info from page 1 for consistency
      if (i === 0) {
        page1Analysis = result.analysisText || "";
        const extractedCharacterDetails = result.characterDetails || "";
        
        console.log(`[CHARACTER_DEBUG] Page 1 character extraction result:`, extractedCharacterDetails);
        console.log(`[CHARACTER_DEBUG] Character details length:`, extractedCharacterDetails.length);
        
        // Use actual character details from page 1 analysis
        if (extractedCharacterDetails && extractedCharacterDetails.trim().length > 0) {
          characterDescriptions = `MAIN CHARACTER CONSISTENCY from Page 1:
${extractedCharacterDetails}

CRITICAL: Maintain these exact character features in all subsequent pages:
- Keep identical appearance, clothing, and distinctive visual elements
- Character must be immediately recognizable as the same person
- Preserve the artistic style and colors used for this character in page 1`;
          
          console.log(`[CHARACTER_DEBUG] Using extracted character details for subsequent pages`);
        } else {
          characterDescriptions = `MAIN CHARACTER CONSISTENCY from Page 1:
- Keep the same character appearance, facial features, and expression style  
- Maintain consistent clothing colors and style from page 1
- Preserve the same artistic interpretation of the character
- Character should be immediately recognizable as the same person from page 1`;
          
          console.log(`[CHARACTER_DEBUG] Using fallback character descriptions - extraction failed or empty`);
        }
        
        console.log(`[CHARACTER_DEBUG] Final character descriptions:`, characterDescriptions);
        
        artStyleGuidelines = `VISUAL STYLE CONSISTENCY from Page 1:
- Art style: ${stylePrompt}
- Maintain the same artistic approach, line work, and color palette established in page 1
- Keep consistent illustration style and level of detail
- Portrait orientation (2:3 aspect ratio) with safe margins
- Same lighting and artistic treatment`;
      }

      console.log(`[SYNC] Completed page ${currentPage} of ${imageUrls.length}`);
    } catch (error) {
      if (error.message === 'Story transformation was cancelled') {
        console.log(`[SYNC] Story ${storyId} was cancelled, stopping processing at page ${currentPage}`);
        return {
          success: false, 
          message: 'Story transformation was cancelled',
          cancelled: true
        };
      }
      
      console.error(`[SYNC] Failed to process page ${currentPage}:`, error);
      failedPages++;
      
      // Mark this specific page as failed
      await supabase
        .from('story_pages')
        .upsert({
          story_id: storyId,
          page_number: currentPage,
          original_image_url: imageUrls[i].storageUrl || null,
          generated_image_url: null,
          enhanced_prompt: null,
          transformation_status: 'failed'
        }, {
          onConflict: 'story_id,page_number'
        });
    }

    // Reduced delay between pages for faster processing
    if (i < imageUrls.length - 1) {
      const delayMs = 5000; // Reduced from 8000ms to 5000ms
      console.log(`[SYNC] Waiting ${delayMs}ms before processing next page...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Determine final status
  let finalStatus = 'completed';
  let finalDescription = '';
  
  if (failedPages > 0 && successfulPages > 0) {
    finalStatus = 'partial';
    finalDescription = `Story partially completed: ${successfulPages} successful, ${failedPages} failed pages. You can regenerate the failed pages.`;
  } else if (successfulPages === 0) {
    finalStatus = 'failed';
    finalDescription = `Story processing failed: All ${failedPages} pages failed to process.`;
  } else {
    finalDescription = `Story completed successfully with ${successfulPages} pages.`;
  }

  // Update story status
  await supabase
    .from('stories')
    .update({ 
      status: finalStatus,
      total_pages: imageUrls.length,
      description: finalDescription,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId);

  console.log(`[SYNC] Story ${storyId} transformation completed: ${successfulPages} successful, ${failedPages} failed pages`);

  return {
    success: true, 
    message: finalDescription,
    pages_processed: imageUrls.length,
    successful_pages: successfulPages,
    failed_pages: failedPages,
    status: finalStatus,
    processing_mode: 'synchronous'
  };
}
