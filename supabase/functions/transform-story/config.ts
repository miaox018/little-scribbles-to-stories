
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const artStylePrompts = {
  classic_watercolor: `
    Create a professional children's book illustration in classic watercolor painting style with:
    - Soft, flowing colors and gentle brush strokes
    - Pastel tones for a dreamy, ethereal quality
    - Delicate textures and subtle color blending
    - Whimsical and enchanting atmosphere suitable for children
  `,
  digital_art: `
    Create a vibrant digital art illustration for children with:
    - Bold, bright colors with clean lines
    - Modern digital painting techniques
    - Smooth gradients and crisp details
    - Playful and engaging style that appeals to children
  `,
  cartoon_style: `
    Create a fun cartoon-style illustration with:
    - Exaggerated features and expressions
    - Bright, cheerful colors
    - Simple, bold outlines
    - Animated and lively character designs perfect for children's stories
  `,
  realistic_sketch: `
    Create a detailed realistic sketch-style illustration with:
    - Fine pencil or charcoal-like textures
    - Subtle shading and realistic proportions
    - Soft, muted color palette
    - Artistic and sophisticated style while remaining child-friendly
  `
};
