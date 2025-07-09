import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Camera, FileText, Cloud } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Video className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold text-gray-900">VideoAnalyzer Pro</span>
            </div>
            <Button onClick={() => setShowAuthModal(true)}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl mb-8">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AI-Powered Video Analysis
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Extract key insights, generate summaries, and create detailed reports from your videos automatically
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-3"
                onClick={() => setShowAuthModal(true)}
              >
                Start Analysis
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-3"
              >
                View Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="text-primary text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Key Frame Extraction</h3>
              <p className="text-gray-600">
                Automatically identify and extract important moments from your videos with precise timestamps.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="text-accent text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Reports</h3>
              <p className="text-gray-600">
                Generate comprehensive Word documents with screenshots, analysis, and detailed summaries.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Sources</h3>
              <p className="text-gray-600">
                Upload local videos or analyze content directly from YouTube URLs with ease.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}
