
export async function uploadImageToSupabase(base64Image: string, storyId: string, pageNumber: number, userId: string, supabase: any) {
  try {
    // Convert base64 to blob
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const imageBlob = new Blob([byteArray], { type: 'image/png' });
    
    const fileName = `${userId}/generated/${storyId}/page_${pageNumber}_${Date.now()}.png`;
    
    console.log(`Uploading image to: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);

    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    console.log('Generated public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    throw error;
  }
}

export async function uploadOriginalImageToSupabase(imageDataUrl: string, storyId: string, pageNumber: number, userId: string, supabase: any) {
  try {
    // Extract base64 data from data URL
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];
    
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const imageBlob = new Blob([byteArray], { type: mimeType });
    
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `${userId}/original/${storyId}/page_${pageNumber}_${Date.now()}.${extension}`;
    
    console.log(`Uploading original image to: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(fileName, imageBlob, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Original upload error:', uploadError);
      throw uploadError;
    }

    console.log('Original upload successful:', uploadData);

    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    console.log('Generated original public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadOriginalImageToSupabase:', error);
    throw error;
  }
}
