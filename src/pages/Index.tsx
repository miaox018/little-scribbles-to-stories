
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BookOpen, Mail } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StoryMagic
          </div>
          <div className="space-x-4">
            <Button variant="ghost">How it Works</Button>
            <Button variant="ghost">Pricing</Button>
            <Button>Get Started</Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-fade-in">
            Transform Your Child's Drawings Into
            <span className="block mt-2">Professional Storybooks</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in">
            Upload your child's hand-drawn story pages and watch as AI transforms them into beautifully illustrated, professional children's books with consistent characters and magical storytelling.
          </p>
          <div className="space-x-4 animate-fade-in">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg">
              <Upload className="mr-2 h-5 w-5" />
              Create Your Story
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          How StoryMagic Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">1. Upload Drawings</h3>
              <p className="text-gray-600">
                Take photos or scan your child's hand-drawn story pages and upload them to our platform. We support multiple pages for complete stories.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-white rounded text-pink-500 flex items-center justify-center font-bold">
                  AI
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">2. AI Transformation</h3>
              <p className="text-gray-600">
                Our advanced AI analyzes the drawings and creates professional illustrations while maintaining character consistency and your child's original story vision.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">3. Enjoy & Share</h3>
              <p className="text-gray-600">
                Review, edit, and save your professional storybook. Read it together, add it to your digital library, or share with family and friends via email.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-white/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-800">
            Magical Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-purple-700">Character Consistency</h3>
              <p className="text-gray-600 mb-4">
                Our AI maintains the same characters throughout your story, ensuring continuity and professional quality across all pages.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-pink-700">Digital Library</h3>
              <p className="text-gray-600 mb-4">
                All your created storybooks are saved in a beautiful digital library where you can read them anytime with your child.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-blue-700">Easy Sharing</h3>
              <p className="text-gray-600 mb-4">
                Share your child's masterpieces with grandparents, friends, and family via email or direct links.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-purple-700">Instant Preview</h3>
              <p className="text-gray-600 mb-4">
                Review your transformed storybook immediately and make text edits or request AI iterations before finalizing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Bring Your Child's Stories to Life?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of families creating magical storybooks together. Start your first transformation today!
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
            <Upload className="mr-2 h-5 w-5" />
            Start Creating Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StoryMagic
          </div>
          <div className="flex space-x-6 text-gray-600">
            <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
          </div>
        </div>
        <div className="text-center mt-4 text-gray-500">
          <p>&copy; 2024 StoryMagic. Transforming imagination into beautiful stories.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
