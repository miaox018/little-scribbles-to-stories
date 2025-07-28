import { useMemo } from 'react';

export const useMaintenanceMode = () => {
  const isMaintenanceMode = useMemo(() => {
    // Check environment variable for maintenance mode
    const envMaintenance = import.meta.env.VITE_MAINTENANCE_MODE;
    
    // Check if we're in development (localhost)
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');
    
    // In development: use environment variable (default false)
    // In production: enable maintenance mode by default, unless explicitly disabled
    let maintenanceEnabled;
    
    if (isDevelopment) {
      // Development mode: only enable if explicitly set to true
      maintenanceEnabled = envMaintenance === 'true' || envMaintenance === '1';
    } else {
      // Production mode: enable by default, disable only if explicitly set to false
      maintenanceEnabled = envMaintenance !== 'false' && envMaintenance !== '0';
    }
    
    console.log('🚧 Maintenance mode check:', {
      hostname: window.location.hostname,
      isDevelopment,
      envMaintenance,
      result: maintenanceEnabled
    });
    
    return maintenanceEnabled;
  }, []);

  const isAdminOverride = useMemo(() => {
    // Check for admin override (can be expanded later)
    const adminOverride = import.meta.env.VITE_ADMIN_OVERRIDE;
    return adminOverride === 'true' || adminOverride === '1';
  }, []);

  return {
    isMaintenanceMode,
    isAdminOverride,
    shouldBlockAccess: isMaintenanceMode && !isAdminOverride
  };
};