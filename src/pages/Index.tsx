
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Sparkles, BookOpen, Mail, Eye, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          StoryMagic
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="#how-it-works" className="text-gray-600 hover:text-purple-600 transition-colors">
            How it Works
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors">
            Pricing
          </a>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Link to="/dashboard">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
          Transform Your Child's{" "}
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Drawings Into
          </span>{" "}
          Professional Storybooks
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Upload your child's hand-drawn story pages and watch as AI transforms them into beautifully illustrated, 
          professional children's books with consistent characters and magical storytelling.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            asChild
            className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Link to="/dashboard">
              <Upload className="mr-2 h-5 w-5" />
              Create Your Story
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-purple-300 text-purple-600 hover:bg-purple-50">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-6 py-20 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            How StoryMagic Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">1. Upload Story Pages</h3>
                <p className="text-gray-600">
                  Simply upload photos of your child's hand-drawn story pages. Our AI can handle any drawing style!
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">2. AI Transforms</h3>
                <p className="text-gray-600">
                  Our advanced AI maintains character consistency while creating beautiful, professional illustrations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">3. Enjoy & Share</h3>
                <p className="text-gray-600">
                  Read your digital storybook immediately, save to your library, and share with family and friends.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            Why Parents Love StoryMagic
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Character Consistency</h3>
              <p className="text-sm text-gray-600">AI maintains the same characters throughout the entire story</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Digital Library</h3>
              <p className="text-sm text-gray-600">Access all your stories anytime, anywhere</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Easy Sharing</h3>
              <p className="text-sm text-gray-600">Email books to grandparents and friends instantly</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Instant Preview</h3>
              <p className="text-sm text-gray-600">See results immediately and make edits if needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Create Magic?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Transform your child's creativity into beautiful, shareable storybooks today.
          </p>
          <Button 
            size="lg" 
            asChild
            className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-gray-100"
          >
            <Link to="/dashboard">
              Start Creating Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 md:mb-0">
              StoryMagic
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2024 StoryMagic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
