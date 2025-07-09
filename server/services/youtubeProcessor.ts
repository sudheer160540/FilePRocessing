import ytdl from "ytdl-core";
import { storage } from "../storage";
import { processVideo } from "./videoProcessor";
import path from "path";
import fs from "fs";

export async function processYouTubeVideo(analysisId: number, youtubeUrl: string): Promise<void> {
  try {
    // Update status to processing
    await storage.updateVideoAnalysis(analysisId, {
      status: "processing",
      processingStarted: new Date(),
    });

    // Download video using yt-dlp
    const videoPath = await downloadYouTubeVideo(youtubeUrl, analysisId);

    // Update analysis with file path
    await storage.updateVideoAnalysis(analysisId, {
      filePath: videoPath,
    });

    // Process the downloaded video
    await processVideo(analysisId, videoPath);

  } catch (error) {
    console.error("Error processing YouTube video:", error);
    await storage.updateVideoAnalysis(analysisId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

function downloadYouTubeVideo(youtubeUrl: string, analysisId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputDir = path.join("downloads", `analysis_${analysisId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `video_${analysisId}.mp4`);
    
    try {
      const stream = ytdl(youtubeUrl, { 
        format: 'mp4',
        quality: 'highest'
      });
      
      const writeStream = fs.createWriteStream(outputPath);
      
      stream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        resolve(outputPath);
      });
      
      writeStream.on('error', (error) => {
        reject(error);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}
