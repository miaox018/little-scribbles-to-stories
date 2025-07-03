
import { corsHeaders } from './config.ts';

export async function handleCorsRequest(): Promise<Response> {
  console.log('Handling CORS preflight request');
  return new Response('ok', { headers: corsHeaders });
}

export async function validateRequest(req: Request): Promise<{ requestBody: any; bodyText: string }> {
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Get the raw request body
  console.log('Reading request body...');
  const bodyText = await req.text();
  console.log('Raw body received - length:', bodyText.length);
  console.log('Raw body first 500 chars:', bodyText.substring(0, 500));
  
  // Check if body is empty or invalid
  if (!bodyText || bodyText.trim() === '') {
    console.error('ERROR: Empty request body received');
    throw new Error(JSON.stringify({ 
      error: 'Empty request body', 
      received_length: bodyText?.length || 0,
      received_content: bodyText || 'null'
    }));
  }

  // Try to parse JSON
  let requestBody;
  try {
    console.log('Attempting to parse JSON...');
    requestBody = JSON.parse(bodyText);
    console.log('JSON parsed successfully');
    console.log('Request body keys:', Object.keys(requestBody));
    console.log('Request body structure:', {
      storyId: requestBody.storyId ? 'present' : 'missing',
      imageUrls: requestBody.imageUrls ? `array of ${requestBody.imageUrls.length}` : 'missing',
      artStyle: requestBody.artStyle || 'missing'
    });
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError);
    console.error('Parse error details:', parseError.message);
    throw new Error(JSON.stringify({ 
      error: 'Invalid JSON in request body', 
      details: parseError.message,
      received_body: bodyText.substring(0, 1000)
    }));
  }
  
  return { requestBody, bodyText };
}

export function validateRequestBody(requestBody: any) {
  const { storyId, imageUrls, artStyle = 'classic_watercolor' } = requestBody;

  console.log(`Processing story ${storyId} with ${imageUrls?.length || 0} image URLs in ${artStyle} style`);

  // Validate required fields
  if (!storyId) {
    console.error('ERROR: Missing storyId');
    throw new Error(JSON.stringify({ error: 'Missing storyId in request body' }));
  }

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    console.error('ERROR: Invalid or missing imageUrls array');
    throw new Error(JSON.stringify({ 
      error: 'Invalid or missing imageUrls array', 
      received_imageUrls: imageUrls ? `type: ${typeof imageUrls}, length: ${imageUrls.length}` : 'null'
    }));
  }

  return { storyId, imageUrls, artStyle };
}
