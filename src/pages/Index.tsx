import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, BookOpen, Wand2, Heart, FileText } from "lucide-react";
const Index = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <Sparkles className="h-8 w-8 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">StoryMagic</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/blog" className="text-gray-600 hover:text-purple-600 transition-colors flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Get Started
            </Button>
          </Link>
        </nav>
        <div className="md:hidden">
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Get Started
            </Button>
          </Link>
        </div>
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
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Upload your child's hand-drawn story pages and watch as AI transforms them into beautifully illustrated, professional children's books     


Story Magic is powered by My-Little-Illustrator</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-4">
                <Wand2 className="mr-2 h-5 w-5" />
                Start Creating Magic
              </Button>
            </Link>
            <Link to="/blog">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                <FileText className="mr-2 h-5 w-5" />
                Read Our Blog
              </Button>
            </Link>
          </div>
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

      {/* Blog Preview Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Storytelling Tips & Inspiration
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover expert advice on nurturing your child's creativity and turning their imagination into lasting memories.
          </p>
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Encourage Storytelling</h4>
              <p className="text-sm text-gray-600">5 screen-free ways to spark your child's imagination</p>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Drawing to Storybook</h4>
              <p className="text-sm text-gray-600">Transform artwork into magical keepsakes</p>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Grandparent Gifts</h4>
              <p className="text-sm text-gray-600">Create meaningful family heirlooms</p>
            </div>
          </div>
          <Link to="/blog">
            <Button variant="outline" size="lg">
              <FileText className="mr-2 h-5 w-5" />
              Explore All Articles
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 StoryMagic. Made with love for creative families.</p>
      </footer>
    </div>;
};
export default Index;