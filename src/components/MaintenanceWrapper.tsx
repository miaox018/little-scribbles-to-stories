import { ReactNode } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { MaintenanceMode } from './MaintenanceMode';

interface MaintenanceWrapperProps {
  children: ReactNode;
}

export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const { shouldBlockAccess } = useMaintenanceMode();

  if (shouldBlockAccess) {
    return <MaintenanceMode />;
  }

  return <>{children}</>;
}