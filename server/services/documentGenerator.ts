import { storage } from "../storage";
import path from "path";
import fs from "fs";

export async function generateReport(analysisId: number): Promise<string> {
  try {
    const analysis = await storage.getVideoAnalysis(analysisId);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const keyFrames = await storage.getKeyFramesByAnalysis(analysisId);
    const metadata = await storage.getAnalysisMetadata(analysisId);
    const audioTranscription = await storage.getAudioTranscription(analysisId);

    // Create reports directory
    const reportsDir = path.join("reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `analysis_${analysisId}_report.docx`);

    // Generate Word document using a simple approach
    // Note: In a real implementation, you would use a proper Word generation library
    // For now, we'll create a rich text document with HTML-like structure
    const reportContent = generateReportContent(analysis, keyFrames, metadata, audioTranscription);
    
    // Save as HTML file (can be opened by Word)
    const htmlReportPath = path.join(reportsDir, `analysis_${analysisId}_report.html`);
    fs.writeFileSync(htmlReportPath, reportContent);

    // For demonstration, we'll use the HTML file as the report
    // In production, you'd use a proper Word generation library like docx or mammoth
    return htmlReportPath;

  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

function generateReportContent(analysis: any, keyFrames: any[], metadata: any[], audioTranscription: any = null): string {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const metadataMap = metadata.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Video Analysis Report - ${analysis.fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #2563eb; font-size: 24px; font-weight: bold; }
        .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #1f2937; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; }
        .info-label { font-weight: bold; color: #374151; }
        .info-value { color: #6b7280; }
        .keyframes-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .keyframe { text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px; }
        .keyframe img { max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; }
        .timestamp { font-weight: bold; color: #2563eb; }
        .description { font-size: 12px; color: #6b7280; }
        .summary { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Video Analysis Report</div>
        <div class="subtitle">Generated on ${formatDate(new Date())}</div>
    </div>

    <div class="section">
        <div class="section-title">Video Information</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">File Name</div>
                <div class="info-value">${analysis.fileName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Duration</div>
                <div class="info-value">${analysis.duration ? formatTime(analysis.duration) : 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Resolution</div>
                <div class="info-value">${analysis.resolution || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Format</div>
                <div class="info-value">${analysis.format || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">File Size</div>
                <div class="info-value">${analysis.fileSize ? `${(analysis.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Key Frames</div>
                <div class="info-value">${analysis.keyFramesCount || 0}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Analysis Summary</div>
        <div class="summary">
            <p><strong>Processing Overview:</strong></p>
            <ul>
                <li>Total processing time: ${analysis.processingStarted && analysis.processingCompleted ? 
                    `${Math.round((new Date(analysis.processingCompleted).getTime() - new Date(analysis.processingStarted).getTime()) / 1000)} seconds` : 'N/A'}</li>
                <li>Key frames extracted: ${analysis.keyFramesCount || 0}</li>
                <li>Frame rate: ${metadataMap.frame_rate ? `${parseFloat(metadataMap.frame_rate).toFixed(2)} fps` : 'N/A'}</li>
                <li>Total frames: ${metadataMap.total_frames || 'N/A'}</li>
            </ul>
            <p><strong>Content Analysis:</strong></p>
            <p>This video has been automatically analyzed to extract key moments and visual information. 
            The following screenshots represent significant frames that were detected during the analysis process.</p>
        </div>
    </div>

    ${keyFrames.length > 0 ? `
    <div class="section">
        <div class="section-title">Key Frames (${keyFrames.length} frames)</div>
        <div class="keyframes-grid">
            ${keyFrames.map(frame => `
                <div class="keyframe">
                    <div class="timestamp">${formatTime(frame.timestamp)}</div>
                    <div class="description">${frame.description}</div>
                </div>
            `).join('')}
        </div>
    </div>` : ''}

    <div class="section">
        <div class="section-title">Technical Details</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Analysis ID</div>
                <div class="info-value">${analysis.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Started</div>
                <div class="info-value">${analysis.processingStarted ? formatDate(analysis.processingStarted) : 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Completed</div>
                <div class="info-value">${analysis.processingCompleted ? formatDate(analysis.processingCompleted) : 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">${analysis.status}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Report Information</div>
        <p style="color: #6b7280; font-size: 14px;">
            This report was automatically generated by VideoAnalyzer Pro. 
            The analysis includes key frame extraction, video metadata processing, and content summarization.
            For questions about this report, please contact support.
        </p>
    </div>
</body>
</html>`;
}
