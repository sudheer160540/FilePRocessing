import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertVideoAnalysisSchema, youtubeUrlSchema } from "@shared/schema";
import { processVideo } from "./services/videoProcessor";
import { processYouTubeVideo } from "./services/youtubeProcessor";
import { generateReport } from "./services/documentGenerator";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, AVI, MOV, and MKV files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Video analysis routes
  app.post('/api/video/upload', isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create video analysis record
      const analysis = await storage.createVideoAnalysis({
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        filePath: file.path,
        format: path.extname(file.originalname).toLowerCase(),
        status: "pending",
      });

      // Start processing asynchronously
      processVideo(analysis.id, file.path)
        .then(() => {
          console.log(`Video processing completed for analysis ${analysis.id}`);
        })
        .catch((error) => {
          console.error(`Video processing failed for analysis ${analysis.id}:`, error);
          storage.updateVideoAnalysis(analysis.id, {
            status: "failed",
            errorMessage: error.message,
          });
        });

      res.json({ analysisId: analysis.id, message: "Video uploaded and processing started" });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  app.post('/api/video/youtube', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { youtubeUrl } = youtubeUrlSchema.parse(req.body);

      // Create video analysis record
      const analysis = await storage.createVideoAnalysis({
        userId,
        fileName: `YouTube Video - ${new Date().toISOString()}`,
        youtubeUrl,
        status: "pending",
      });

      // Start processing asynchronously
      processYouTubeVideo(analysis.id, youtubeUrl)
        .then(() => {
          console.log(`YouTube video processing completed for analysis ${analysis.id}`);
        })
        .catch((error) => {
          console.error(`YouTube video processing failed for analysis ${analysis.id}:`, error);
          storage.updateVideoAnalysis(analysis.id, {
            status: "failed",
            errorMessage: error.message,
          });
        });

      res.json({ analysisId: analysis.id, message: "YouTube video processing started" });
    } catch (error) {
      console.error("Error processing YouTube video:", error);
      res.status(500).json({ message: "Failed to process YouTube video" });
    }
  });

  app.get('/api/analysis/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysisId = parseInt(req.params.id);

      const analysis = await storage.getVideoAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      if (analysis.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const keyFrames = await storage.getKeyFramesByAnalysis(analysisId);
      const metadata = await storage.getAnalysisMetadata(analysisId);

      res.json({
        analysis,
        keyFrames,
        metadata,
      });
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.get('/api/analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await storage.getUserVideoAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.get('/api/analysis/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysisId = parseInt(req.params.id);

      const analysis = await storage.getVideoAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      if (analysis.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (analysis.status !== "completed") {
        return res.status(400).json({ message: "Analysis not completed" });
      }

      if (!analysis.reportPath || !fs.existsSync(analysis.reportPath)) {
        // Generate report if it doesn't exist
        const reportPath = await generateReport(analysisId);
        await storage.updateVideoAnalysis(analysisId, { reportPath });
        analysis.reportPath = reportPath;
      }

      res.download(analysis.reportPath, `${analysis.fileName}_analysis.docx`);
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  app.delete('/api/analysis/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysisId = parseInt(req.params.id);

      const analysis = await storage.getVideoAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      if (analysis.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Clean up files
      if (analysis.filePath && fs.existsSync(analysis.filePath)) {
        fs.unlinkSync(analysis.filePath);
      }
      if (analysis.reportPath && fs.existsSync(analysis.reportPath)) {
        fs.unlinkSync(analysis.reportPath);
      }

      // Clean up key frame images
      const keyFrames = await storage.getKeyFramesByAnalysis(analysisId);
      keyFrames.forEach(frame => {
        if (fs.existsSync(frame.imagePath)) {
          fs.unlinkSync(frame.imagePath);
        }
      });

      // Delete from database
      await storage.deleteKeyFramesByAnalysis(analysisId);
      await storage.deleteAnalysisMetadata(analysisId);
      await storage.deleteVideoAnalysis(analysisId);

      res.json({ message: "Analysis deleted successfully" });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
