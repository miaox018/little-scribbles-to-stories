
const MAX_IMAGES = 15;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove potential XSS vectors and normalize whitespace
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>&"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return entities[char] || char;
    })
    .trim()
    .substring(0, MAX_TITLE_LENGTH);
}

export function validateStoryTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new Error('Story title is required and must be a string');
  }
  
  const sanitized = sanitizeString(title);
  
  if (sanitized.length < 1) {
    throw new Error('Story title cannot be empty');
  }
  
  if (sanitized.length > MAX_TITLE_LENGTH) {
    throw new Error(`Story title cannot exceed ${MAX_TITLE_LENGTH} characters`);
  }
  
  return sanitized;
}

export function validateArtStyle(artStyle: string): string {
  const allowedStyles = [
    'classic_watercolor',
    'disney_animation', 
    'realistic_digital',
    'manga_anime',
    'vintage_storybook'
  ];
  
  if (!artStyle || typeof artStyle !== 'string') {
    return 'classic_watercolor'; // Default fallback
  }
  
  const sanitized = artStyle.toLowerCase().trim();
  
  if (!allowedStyles.includes(sanitized)) {
    return 'classic_watercolor'; // Default fallback
  }
  
  return sanitized;
}

export function validateImageUrls(imageUrls: any[]): void {
  if (!Array.isArray(imageUrls)) {
    throw new Error('Image URLs must be an array');
  }
  
  if (imageUrls.length === 0) {
    throw new Error('At least one image is required');
  }
  
  if (imageUrls.length > MAX_IMAGES) {
    throw new Error(`Cannot process more than ${MAX_IMAGES} images`);
  }
  
  imageUrls.forEach((imageUrl, index) => {
    if (!imageUrl || typeof imageUrl !== 'object') {
      throw new Error(`Invalid image data at index ${index}`);
    }
    
    if (!imageUrl.storageUrl || typeof imageUrl.storageUrl !== 'string') {
      throw new Error(`Missing or invalid storage URL at index ${index}`);
    }
    
    // Validate URL format
    try {
      new URL(imageUrl.storageUrl);
    } catch {
      throw new Error(`Invalid URL format at index ${index}`);
    }
    
    // Ensure URL is from the expected domain
    const url = new URL(imageUrl.storageUrl);
    if (!url.hostname.endsWith('.supabase.co')) {
      throw new Error(`Invalid storage domain at index ${index}`);
    }
  });
}

export function validateRequestSize(bodyText: string): void {
  const MAX_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB
  
  if (bodyText.length > MAX_REQUEST_SIZE) {
    throw new Error(`Request size exceeds maximum allowed size of ${MAX_REQUEST_SIZE} bytes`);
  }
}

export function validateStoryId(storyId: string): string {
  if (!storyId || typeof storyId !== 'string') {
    throw new Error('Story ID is required and must be a string');
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(storyId)) {
    throw new Error('Story ID must be a valid UUID');
  }
  
  return storyId;
}
