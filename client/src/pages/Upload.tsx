import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import ProcessingSection from "@/components/ProcessingSection";
import ResultsSection from "@/components/ResultsSection";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Upload as UploadIcon, Youtube, FileVideo, AlertCircle } from "lucide-react";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [currentSection, setCurrentSection] = useState<"upload" | "processing" | "results">("upload");

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

  const { data: analysisData, refetch: refetchAnalysis } = useQuery({
    queryKey: ["/api/analysis", currentAnalysisId],
    enabled: !!currentAnalysisId,
    refetchInterval: currentSection === "processing" ? 2000 : false,
  });

  useEffect(() => {
    if (analysisData?.analysis?.status === "completed") {
      setCurrentSection("results");
    } else if (analysisData?.analysis?.status === "failed") {
      setCurrentSection("upload");
      toast({
        title: "Analysis Failed",
        description: analysisData.analysis.errorMessage || "An error occurred during processing.",
        variant: "destructive",
      });
    }
  }, [analysisData, toast]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const response = await fetch("/api/video/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setCurrentAnalysisId(result.analysisId);
      setCurrentSection("processing");
      
      toast({
        title: "Upload Successful",
        description: "Your video has been uploaded and processing has started.",
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleYouTubeSubmit = async () => {
    if (!youtubeUrl.trim()) return;

    setUploading(true);
    try {
      const response = await apiRequest("POST", "/api/video/youtube", {
        youtubeUrl: youtubeUrl.trim(),
      });

      const result = await response.json();
      setCurrentAnalysisId(result.analysisId);
      setCurrentSection("processing");
      
      toast({
        title: "Processing Started",
        description: "YouTube video processing has started.",
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Processing Failed",
        description: "Failed to process YouTube video. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a video file (MP4, AVI, MOV).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a video smaller than 500MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setYoutubeUrl("");
    setCurrentAnalysisId(null);
    setCurrentSection("upload");
  };

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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentSection === "upload" && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Video</h1>
                <p className="text-gray-600">Choose a video file from your device or provide a YouTube URL</p>
              </div>

              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                  <TabsTrigger value="url">YouTube URL</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary transition-colors">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Drop your video here</h3>
                    <p className="text-gray-500 mb-4">or click to browse files</p>
                    <input
                      type="file"
                      accept=".mp4,.mov,.avi,.mkv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button
                      onClick={() => document.getElementById('video-upload')?.click()}
                      variant="outline"
                      className="mb-2"
                    >
                      Choose File
                    </Button>
                    <p className="text-sm text-gray-400">Supports MP4, MOV, AVI, MKV (Max 500MB)</p>
                  </div>

                  {selectedFile && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileVideo className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-sm text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleFileUpload}
                            disabled={uploading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {uploading ? "Uploading..." : "Start Analysis"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-6">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="text-center">
                      <Youtube className="mx-auto h-12 w-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">YouTube Video</h3>
                      <p className="text-gray-500">Enter a YouTube URL to analyze</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="youtube-url">YouTube URL</Label>
                      <Input
                        id="youtube-url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      onClick={handleYouTubeSubmit}
                      disabled={!youtubeUrl.trim() || uploading}
                      className="w-full"
                    >
                      {uploading ? "Processing..." : "Analyze Video"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {currentSection === "processing" && (
          <ProcessingSection 
            analysisData={analysisData} 
            onComplete={() => setCurrentSection("results")}
          />
        )}

        {currentSection === "results" && (
          <ResultsSection 
            analysisData={analysisData}
            onStartNew={resetUpload}
          />
        )}
      </main>
    </div>
  );
}
