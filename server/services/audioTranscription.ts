import OpenAI from "openai";
import { spawn } from "child_process";
import { storage } from "../storage";
import path from "path";
import fs from "fs";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeVideoAudio(analysisId: number, videoPath: string): Promise<void> {
  try {
    console.log(`Starting audio transcription for analysis ${analysisId}`);

    // Create output directory for audio files
    const outputDir = path.join("outputs", `analysis_${analysisId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract audio from video
    const audioPath = path.join(outputDir, "audio.wav");
    await extractAudioFromVideo(videoPath, audioPath);

    // Check if audio file was created and has content
    if (!fs.existsSync(audioPath)) {
      throw new Error("Audio extraction failed - no audio file created");
    }

    const audioStats = fs.statSync(audioPath);
    if (audioStats.size === 0) {
      console.log(`No audio content found in video for analysis ${analysisId}`);
      return;
    }

    console.log(`Audio extracted successfully: ${audioPath} (${audioStats.size} bytes)`);

    // Transcribe audio using OpenAI Whisper
    const transcriptionResult = await transcribeAudioWithWhisper(audioPath);

    // Store transcription in database
    await storage.createAudioTranscription({
      analysisId,
      transcriptionText: transcriptionResult.text,
      duration: transcriptionResult.duration,
      language: transcriptionResult.language,
      confidence: Math.round((transcriptionResult.confidence || 0.8) * 100),
      audioPath: audioPath,
    });

    console.log(`Audio transcription completed for analysis ${analysisId}`);

  } catch (error) {
    console.error(`Error transcribing audio for analysis ${analysisId}:`, error);
    // Don't throw the error - just log it so video processing can continue
    // Store empty transcription to indicate attempt was made
    try {
      await storage.createAudioTranscription({
        analysisId,
        transcriptionText: "Audio transcription failed: " + (error instanceof Error ? error.message : "Unknown error"),
        duration: 0,
        language: null,
        confidence: 0,
        audioPath: null,
      });
    } catch (dbError) {
      console.error("Failed to store error transcription:", dbError);
    }
  }
}

function extractAudioFromVideo(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Extracting audio from ${videoPath} to ${audioPath}`);
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vn', // No video
      '-acodec', 'pcm_s16le', // PCM 16-bit little-endian
      '-ar', '16000', // 16kHz sample rate (optimal for Whisper)
      '-ac', '1', // Mono audio
      '-y', // Overwrite output file if it exists
      audioPath
    ]);

    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error(`FFmpeg audio extraction failed with code ${code}`);
        console.error(`FFmpeg stderr: ${stderr}`);
        reject(new Error(`Audio extraction failed with code ${code}`));
        return;
      }
      
      console.log(`Audio extraction completed successfully`);
      resolve();
    });

    ffmpeg.on('error', (err) => {
      console.error(`FFmpeg spawn error: ${err}`);
      reject(err);
    });
  });
}

interface TranscriptionResult {
  text: string;
  duration: number;
  language: string | null;
  confidence?: number;
}

async function transcribeAudioWithWhisper(audioPath: string): Promise<TranscriptionResult> {
  try {
    console.log(`Transcribing audio file: ${audioPath}`);
    
    const audioReadStream = fs.createReadStream(audioPath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "verbose_json",
      language: undefined, // Auto-detect language
    });

    console.log(`Transcription successful - Text length: ${transcription.text.length} characters`);
    
    return {
      text: transcription.text,
      duration: transcription.duration || 0,
      language: transcription.language || null,
      confidence: 0.8, // Whisper doesn't provide confidence, so we use a default
    };

  } catch (error) {
    console.error("OpenAI Whisper transcription error:", error);
    throw error;
  }
}