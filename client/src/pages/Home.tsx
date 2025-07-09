import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Video, BarChart3, Clock, TrendingUp } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-gray-600 mb-6">
              Ready to analyze your videos? Upload a file or paste a YouTube URL to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => setLocation("/upload")}
                className="flex items-center gap-2"
              >
                <Video className="w-5 h-5" />
                Start New Analysis
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setLocation("/dashboard")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                View Dashboard
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Analyses</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
                <Video className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">-</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-yellow-600">-</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Key Frames</p>
                  <p className="text-2xl font-bold text-purple-600">-</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Getting Started */}
        <section>
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Upload Your Video</h3>
                  <p className="text-gray-600">
                    Upload video files directly from your computer or provide a YouTube URL 
                    for automatic processing and analysis.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Supported formats: MP4, AVI, MOV, MKV</li>
                    <li>• Maximum file size: 500MB</li>
                    <li>• YouTube URLs are automatically processed</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Analysis Features</h3>
                  <p className="text-gray-600">
                    Our AI-powered analysis extracts key insights and generates 
                    comprehensive reports with screenshots and timestamps.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Automatic key frame extraction</li>
                    <li>• Detailed Word document reports</li>
                    <li>• Timestamp-based screenshots</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
