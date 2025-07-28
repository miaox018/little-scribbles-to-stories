export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function checkMaintenanceMode(): Response | null {
  const isMaintenanceMode = Deno.env.get('MAINTENANCE_MODE') === 'true';
  const isAdminOverride = Deno.env.get('ADMIN_OVERRIDE') === 'true';
  
  if (isMaintenanceMode && !isAdminOverride) {
    console.log('🚧 Service under maintenance - blocking request');
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable for maintenance',
      maintenance: true,
      message: 'StoryMagic is currently under maintenance. Please try again later.'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return null;
}