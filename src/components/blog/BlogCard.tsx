
import { Link } from "react-router-dom";
import { BlogPostMeta } from "@/lib/blog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface BlogCardProps {
  post: BlogPostMeta;
}

export function BlogCard({ post }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg flex items-center justify-center">
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover rounded-t-lg"
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Link to={`/blog/${post.slug}`} className="group">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 mb-4 flex-grow line-clamp-3">
          {post.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.publishDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
