// Feature flags for the application
export const FEATURES = {
  // Google OAuth Feature Flag
  // Set to 'true' to enable Google OAuth authentication
  // Set to 'false' to temporarily disable Google OAuth while waiting for verification approval
  // When Google OAuth is disabled, users can still sign in/up with email and password
  GOOGLE_AUTH_ENABLED: false,
  
  // Other feature flags can be added here in the future
} as const;

export default FEATURES;