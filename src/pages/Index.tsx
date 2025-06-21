
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, BookOpen, Wand2, Heart } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <Sparkles className="h-8 w-8 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">StoryMagic</h1>
        </div>
        <Link to="/auth">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Get Started
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Transform Your Child's
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {" "}Drawings{" "}
            </span>
            into Magic
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your child's hand-drawn story pages and watch as AI transforms them into beautifully illustrated, professional children's books with consistent characters and magical storytelling.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-4">
              <Wand2 className="mr-2 h-5 w-5" />
              Start Creating Magic
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Easy Upload</h3>
              <p className="text-gray-600">
                Simply upload photos of your child's hand-drawn story pages. Our AI will analyze and understand their creative vision.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">AI Magic</h3>
              <p className="text-gray-600">
                Advanced AI transforms rough sketches into beautiful, consistent illustrations while preserving your child's original story and characters.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Professional Books</h3>
              <p className="text-gray-600">
                Get a finished, professional-quality children's book that you can share, print, or keep as a treasured family memory.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 StoryMagic. Made with love for creative families.</p>
      </footer>
    </div>
  );
};

export default Index;
