
import { useParams, Link } from "react-router-dom";
import { getBlogPostBySlug } from "@/lib/blog";
import { BlogContent } from "@/components/blog/BlogContent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar, User, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Blog post not found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const post = getBlogPostBySlug(slug);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Blog post not found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = post.title;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copied!",
        description: "The blog post link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Please copy the URL manually from your browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <BookOpen className="h-6 w-6 text-purple-600 mr-2" />
            <span className="text-xl font-bold text-gray-800">StoryMagic</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Image */}
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-8 overflow-hidden">
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta Information */}
        <div className="flex items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.publishDate)}</span>
          </div>
        </div>

        {/* Content */}
        <BlogContent post={post} />

        {/* CTA Section */}
        <div className="mt-12 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Ready to Turn Your Child's Art into Magic?
          </h3>
          <p className="text-gray-600 mb-6">
            Transform your child's drawings into professional storybooks with StoryMagic.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Start Creating Today
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
