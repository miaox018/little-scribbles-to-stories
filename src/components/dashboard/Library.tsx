
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Mail, Eye } from "lucide-react";

// Mock data for demonstration
const mockBooks = [
  {
    id: 1,
    title: "The Magic Dragon",
    createdAt: "2024-01-15",
    pageCount: 8,
    thumbnail: "/placeholder.svg",
  },
  {
    id: 2,
    title: "Princess and the Castle",
    createdAt: "2024-01-10", 
    pageCount: 6,
    thumbnail: "/placeholder.svg",
  },
  {
    id: 3,
    title: "Space Adventure",
    createdAt: "2024-01-05",
    pageCount: 10,
    thumbnail: "/placeholder.svg",
  },
];

export function Library() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Story Library</h1>
        <p className="text-gray-600">
          All your transformed storybooks in one magical place. Click to read or share with family and friends.
        </p>
      </div>

      {mockBooks.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No stories yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first magical storybook to see it here!
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Create Your First Story
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-0">
                <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-purple-400" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {book.pageCount} pages • Created {new Date(book.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Eye className="mr-1 h-3 w-3" />
                      Read
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="mr-1 h-3 w-3" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
