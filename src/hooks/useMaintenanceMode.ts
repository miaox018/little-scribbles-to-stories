import { useMemo } from 'react';

export const useMaintenanceMode = () => {
  const isMaintenanceMode = useMemo(() => {
    // Check environment variable for maintenance mode
    const envMaintenance = import.meta.env.VITE_MAINTENANCE_MODE;
    return envMaintenance === 'true' || envMaintenance === '1';
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