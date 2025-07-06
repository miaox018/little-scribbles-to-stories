
import { getAllBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

const Blog = () => {
  const posts = getAllBlogPosts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <BookOpen className="h-8 w-8 text-purple-600 mr-2" />
          <span className="text-2xl font-bold text-gray-800">StoryMagic</span>
        </Link>
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Storytelling & Creativity
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {" "}Blog
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover tips, inspiration, and guides to nurture your child's creativity and turn their imagination into lasting memories.
        </p>
      </section>

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-4 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No blog posts available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-white/80 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to Create Your Own Story Magic?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your child's drawings into professional storybooks that preserve their creativity forever.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Start Creating Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Blog;
