
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="text-center p-12">
      <CardContent>
        <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No stories in progress
        </h3>
        <p className="text-gray-500 mb-6">
          Create your first story to see it here for review and editing!
        </p>
      </CardContent>
    </Card>
  );
}
