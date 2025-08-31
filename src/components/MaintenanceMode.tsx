import { AlertTriangle, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaintenanceModeProps {
  isAdmin?: boolean;
  onContinueAsAdmin?: () => void;
}

export function MaintenanceMode({ isAdmin = false, onContinueAsAdmin }: MaintenanceModeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
            <Settings className="h-8 w-8 text-orange-600 animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔧 Maintenance Mode
          </h1>

          {/* Message */}
          <div className="space-y-4 text-gray-600 mb-8">
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">System Temporarily Unavailable</span>
            </div>
            
            <p className="text-sm leading-relaxed">
              We're currently performing important updates to improve your StoryMagic experience. 
              The system will be back online shortly.
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Expected duration: 15-30 minutes</span>
            </div>
          </div>

          {/* Admin Override */}
          {isAdmin && onContinueAsAdmin && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500 mb-3">Administrator Access</p>
              <Button 
                onClick={onContinueAsAdmin}
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Continue as Admin
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
            Thank you for your patience 💜
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-sm text-gray-500">
          <p>For urgent inquiries, please contact support</p>
        </div>
      </div>
    </div>
  );
}