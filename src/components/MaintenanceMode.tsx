import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Clock, Mail } from "lucide-react";

export function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Settings className="h-16 w-16 text-primary animate-spin slow" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            StoryMagic is Under Maintenance
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            We're currently performing scheduled maintenance to improve your experience.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>Expected completion: Within 2-4 hours</span>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">What's happening?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• System updates and security improvements</li>
              <li>• Performance optimizations</li>
              <li>• Database maintenance</li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Need urgent assistance?
          </p>
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Contact Support
          </Button>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          We apologize for any inconvenience and appreciate your patience.
        </div>
      </Card>
    </div>
  );
}