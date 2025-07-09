import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Loader2 } from "lucide-react";

interface ProcessingSectionProps {
  analysisData: any;
  onComplete: () => void;
}

export default function ProcessingSection({ analysisData }: ProcessingSectionProps) {
  const analysis = analysisData?.analysis;
  
  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis data...</p>
        </CardContent>
      </Card>
    );
  }

  const getProcessingSteps = () => {
    const steps = [
      { id: 1, label: "Upload", completed: true },
      { id: 2, label: "Analysis", completed: analysis.status === "completed", active: analysis.status === "processing" },
      { id: 3, label: "Generate", completed: analysis.status === "completed", active: false },
      { id: 4, label: "Complete", completed: analysis.status === "completed", active: false },
    ];
    return steps;
  };

  const getProgressPercentage = () => {
    if (analysis.status === "completed") return 100;
    if (analysis.status === "processing") return 65;
    return 25;
  };

  const getCurrentStepMessage = () => {
    if (analysis.status === "completed") return "Analysis completed successfully";
    if (analysis.status === "processing") return "Extracting key frames and analyzing content...";
    return "Preparing video for analysis...";
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const steps = getProcessingSteps();
  const progress = getProgressPercentage();

  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Processing Your Video</h2>
          <p className="text-gray-600">Please wait while we analyze your video content</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center ${step.active ? 'text-warning' : step.completed ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.active ? 'bg-warning text-white' : 
                    step.completed ? 'bg-primary text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {step.completed ? <CheckCircle className="w-4 h-4" /> : 
                     step.active ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     step.id}
                  </div>
                  <span className="ml-2 text-sm font-medium">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ml-4 ${step.completed ? 'bg-primary' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{getCurrentStepMessage()}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Status */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="text-primary border-primary">
            <Clock className="w-4 h-4 mr-1" />
            {getCurrentStepMessage()}
          </Badge>
        </div>

        {/* Processing Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Video Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Duration: <span className="font-medium">{formatTime(analysis.duration)}</span></p>
                <p>Resolution: <span className="font-medium">{analysis.resolution || 'Processing...'}</span></p>
                <p>Format: <span className="font-medium">{analysis.format || 'Detecting...'}</span></p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Analysis Progress</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Key frames: <span className="font-medium">{analysis.keyFramesCount || 'Processing...'}</span></p>
                <p>Status: <span className="font-medium capitalize">{analysis.status}</span></p>
                <p>Started: <span className="font-medium">
                  {analysis.processingStarted ? 
                    new Date(analysis.processingStarted).toLocaleTimeString() : 
                    'Just now'
                  }
                </span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
