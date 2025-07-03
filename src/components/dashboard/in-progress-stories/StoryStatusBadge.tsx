
import { Loader2, AlertCircle } from "lucide-react";

interface StoryStatusBadgeProps {
  status: string;
}

export function StoryStatusBadge({ status }: StoryStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'failed': return <AlertCircle className="h-3 w-3" />;
      case 'partial': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 ml-1 ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status}
    </span>
  );
}
