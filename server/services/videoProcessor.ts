import { spawn } from "child_process";
import { storage } from "../storage";
import path from "path";
import fs from "fs";

export async function processVideo(analysisId: number, videoPath: string): Promise<void> {
  try {
    // Update status to processing
    await storage.updateVideoAnalysis(analysisId, {
      status: "processing",
      processingStarted: new Date(),
    });

    // Extract video metadata
    const metadata = await extractVideoMetadata(videoPath);
    
    // Update analysis with metadata
    await storage.updateVideoAnalysis(analysisId, {
      duration: metadata.duration,
      resolution: metadata.resolution,
      format: metadata.format,
    });

    // Create output directory for key frames
    const outputDir = path.join("outputs", `analysis_${analysisId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract key frames
    const keyFrames = await extractKeyFrames(videoPath, outputDir, metadata.duration);

    // Store key frames in database
    for (const frame of keyFrames) {
      await storage.createKeyFrame({
        analysisId,
        timestamp: frame.timestamp,
        imagePath: frame.imagePath,
        description: frame.description,
      });
    }

    // Store additional metadata
    await storage.createAnalysisMetadata({
      analysisId,
      key: "total_frames",
      value: metadata.totalFrames.toString(),
    });

    await storage.createAnalysisMetadata({
      analysisId,
      key: "frame_rate",
      value: metadata.frameRate.toString(),
    });

    // Update analysis as completed
    await storage.updateVideoAnalysis(analysisId, {
      status: "completed",
      keyFramesCount: keyFrames.length,
      processingCompleted: new Date(),
    });

  } catch (error) {
    console.error("Error processing video:", error);
    await storage.updateVideoAnalysis(analysisId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

interface VideoMetadata {
  duration: number;
  resolution: string;
  format: string;
  totalFrames: number;
  frameRate: number;
}

function extractVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data;
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}`));
        return;
      }

      try {
        const metadata = JSON.parse(output);
        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const duration = Math.floor(parseFloat(metadata.format.duration));
        const resolution = `${videoStream.width}x${videoStream.height}`;
        const format = path.extname(videoPath).toLowerCase();
        const frameRate = parseFloat(videoStream.r_frame_rate.split('/')[0]) / parseFloat(videoStream.r_frame_rate.split('/')[1]);
        const totalFrames = Math.floor(duration * frameRate);

        resolve({
          duration,
          resolution,
          format,
          totalFrames,
          frameRate,
        });
      } catch (error) {
        reject(error);
      }
    });

    ffprobe.on('error', (error) => {
      reject(error);
    });
  });
}

interface KeyFrame {
  timestamp: number;
  imagePath: string;
  description: string;
}

function extractKeyFrames(videoPath: string, outputDir: string, duration: number): Promise<KeyFrame[]> {
  return new Promise((resolve, reject) => {
    const keyFrames: KeyFrame[] = [];
    const interval = Math.max(1, Math.floor(duration / 20)); // Extract ~20 frames max
    
    const timestamps: number[] = [];
    for (let i = 0; i < duration; i += interval) {
      timestamps.push(i);
    }

    let processedCount = 0;
    const totalFrames = timestamps.length;

    if (totalFrames === 0) {
      resolve([]);
      return;
    }

    timestamps.forEach((timestamp) => {
      const outputPath = path.join(outputDir, `frame_${timestamp}.jpg`);
      
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-y',
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          keyFrames.push({
            timestamp,
            imagePath: outputPath,
            description: `Key frame at ${formatTime(timestamp)}`,
          });
        }

        processedCount++;
        if (processedCount === totalFrames) {
          // Sort by timestamp
          keyFrames.sort((a, b) => a.timestamp - b.timestamp);
          resolve(keyFrames);
        }
      });

      ffmpeg.on('error', (error) => {
        console.error(`Error extracting frame at ${timestamp}:`, error);
        processedCount++;
        if (processedCount === totalFrames) {
          keyFrames.sort((a, b) => a.timestamp - b.timestamp);
          resolve(keyFrames);
        }
      });
    });
  });
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
