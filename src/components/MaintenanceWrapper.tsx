import { useState, useEffect } from "react";
import { MaintenanceMode } from "./MaintenanceMode";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/AuthContext";

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const { isAdmin } = useUserRoles();
  const { user } = useAuth();

  useEffect(() => {
    // Check maintenance mode from environment variable
    const maintenanceEnabled = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
    setIsMaintenanceMode(maintenanceEnabled);
  }, []);

  // If maintenance mode is off, show normal app
  if (!isMaintenanceMode) {
    return <>{children}</>;
  }

  // If admin has overridden maintenance mode, show normal app
  if (adminOverride && isAdmin) {
    return <>{children}</>;
  }

  // Show maintenance mode
  return (
    <MaintenanceMode 
      isAdmin={isAdmin}
      onContinueAsAdmin={() => setAdminOverride(true)}
    />
  );
}