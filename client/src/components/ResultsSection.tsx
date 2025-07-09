import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CheckCircle, Download, RotateCcw, Clock, FileText, Video } from "lucide-react";

interface ResultsSectionProps {
  analysisData: any;
  onStartNew: () => void;
}

export default function ResultsSection({ analysisData, onStartNew }: ResultsSectionProps) {
  const { toast } = useToast();
  const analysis = analysisData?.analysis;
  const keyFrames = analysisData?.keyFrames || [];

  const handleDownload = async () => {
    if (!analysis) return;
    
    try {
      const response = await fetch(`/api/analysis/${analysis.id}/download`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysis.fileName}_analysis.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Report downloaded successfully!",
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
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProcessingTime = () => {
    if (!analysis?.processingStarted || !analysis?.processingCompleted) return 'N/A';
    const start = new Date(analysis.processingStarted);
    const end = new Date(analysis.processingCompleted);
    const diff = Math.round((end.getTime() - start.getTime()) / 1000);
    return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  };

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No analysis data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Analysis Complete</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Analysis ID:</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">#{analysis.id}</code>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-800">Analysis completed successfully!</p>
              <p className="text-sm text-green-700">
                Your video has been processed and the report is ready for download.
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Analysis Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Duration:</span>
                  <span className="font-medium">{formatTime(analysis.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Key Frames Extracted:</span>
                  <span className="font-medium">{analysis.keyFramesCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Time:</span>
                  <span className="font-medium">{getProcessingTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="font-medium">{analysis.resolution || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Report Contents</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2 w-4 h-4" />
                  Video metadata and information
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2 w-4 h-4" />
                  Key frame screenshots with timestamps
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2 w-4 h-4" />
                  AI-generated content summary
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2 w-4 h-4" />
                  Analysis insights and recommendations
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Key Frames Preview */}
        {keyFrames.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Key Frames Preview ({keyFrames.length} frames)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {keyFrames.slice(0, 8).map((frame: any) => (
                <Card key={frame.id} className="relative">
                  <CardContent className="p-2">
                    <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="mt-2 text-center">
                      <Badge variant="outline" className="text-xs">
                        {formatTime(frame.timestamp)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {keyFrames.length > 8 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                And {keyFrames.length - 8} more frames in the full report...
              </p>
            )}
          </div>
        )}

        {/* Download Section */}
        <div className="text-center">
          <Button
            onClick={handleDownload}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white mr-4"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Report
          </Button>
          <Button
            onClick={onStartNew}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Analyze Another Video
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
