import {
  users,
  videoAnalyses,
  keyFrames,
  analysisMetadata,
  type User,
  type UpsertUser,
  type VideoAnalysis,
  type InsertVideoAnalysis,
  type KeyFrame,
  type InsertKeyFrame,
  type AnalysisMetadata,
  type InsertAnalysisMetadata,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Video analysis operations
  createVideoAnalysis(analysis: InsertVideoAnalysis): Promise<VideoAnalysis>;
  getVideoAnalysis(id: number): Promise<VideoAnalysis | undefined>;
  getUserVideoAnalyses(userId: string): Promise<VideoAnalysis[]>;
  updateVideoAnalysis(id: number, updates: Partial<VideoAnalysis>): Promise<VideoAnalysis>;
  deleteVideoAnalysis(id: number): Promise<void>;

  // Key frame operations
  createKeyFrame(keyFrame: InsertKeyFrame): Promise<KeyFrame>;
  getKeyFramesByAnalysis(analysisId: number): Promise<KeyFrame[]>;
  deleteKeyFramesByAnalysis(analysisId: number): Promise<void>;

  // Analysis metadata operations
  createAnalysisMetadata(metadata: InsertAnalysisMetadata): Promise<AnalysisMetadata>;
  getAnalysisMetadata(analysisId: number): Promise<AnalysisMetadata[]>;
  deleteAnalysisMetadata(analysisId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Video analysis operations
  async createVideoAnalysis(analysis: InsertVideoAnalysis): Promise<VideoAnalysis> {
    try {
      const [result] = await db.insert(videoAnalyses).values(analysis).returning();
      return result;
    } catch (error) {
      console.error('Error creating video analysis:', error);
      throw error;
    }
  }

  async getVideoAnalysis(id: number): Promise<VideoAnalysis | undefined> {
    try {
      const [analysis] = await db.select().from(videoAnalyses).where(eq(videoAnalyses.id, id));
      return analysis;
    } catch (error) {
      console.error('Error getting video analysis:', error);
      throw error;
    }
  }

  async getUserVideoAnalyses(userId: string): Promise<VideoAnalysis[]> {
    try {
      return await db
        .select()
        .from(videoAnalyses)
        .where(eq(videoAnalyses.userId, userId))
        .orderBy(desc(videoAnalyses.createdAt));
    } catch (error) {
      console.error('Error getting user video analyses:', error);
      throw error;
    }
  }

  async updateVideoAnalysis(id: number, updates: Partial<VideoAnalysis>): Promise<VideoAnalysis> {
    try {
      const [result] = await db
        .update(videoAnalyses)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(videoAnalyses.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating video analysis:', error);
      throw error;
    }
  }

  async deleteVideoAnalysis(id: number): Promise<void> {
    try {
      await db.delete(videoAnalyses).where(eq(videoAnalyses.id, id));
    } catch (error) {
      console.error('Error deleting video analysis:', error);
      throw error;
    }
  }

  // Key frame operations
  async createKeyFrame(keyFrame: InsertKeyFrame): Promise<KeyFrame> {
    try {
      const [result] = await db.insert(keyFrames).values(keyFrame).returning();
      return result;
    } catch (error) {
      console.error('Error creating key frame:', error);
      throw error;
    }
  }

  async getKeyFramesByAnalysis(analysisId: number): Promise<KeyFrame[]> {
    try {
      return await db
        .select()
        .from(keyFrames)
        .where(eq(keyFrames.analysisId, analysisId))
        .orderBy(keyFrames.timestamp);
    } catch (error) {
      console.error('Error getting key frames:', error);
      throw error;
    }
  }

  async deleteKeyFramesByAnalysis(analysisId: number): Promise<void> {
    try {
      await db.delete(keyFrames).where(eq(keyFrames.analysisId, analysisId));
    } catch (error) {
      console.error('Error deleting key frames:', error);
      throw error;
    }
  }

  // Analysis metadata operations
  async createAnalysisMetadata(metadata: InsertAnalysisMetadata): Promise<AnalysisMetadata> {
    try {
      const [result] = await db.insert(analysisMetadata).values(metadata).returning();
      return result;
    } catch (error) {
      console.error('Error creating analysis metadata:', error);
      throw error;
    }
  }

  async getAnalysisMetadata(analysisId: number): Promise<AnalysisMetadata[]> {
    try {
      return await db
        .select()
        .from(analysisMetadata)
        .where(eq(analysisMetadata.analysisId, analysisId));
    } catch (error) {
      console.error('Error getting analysis metadata:', error);
      throw error;
    }
  }

  async deleteAnalysisMetadata(analysisId: number): Promise<void> {
    try {
      await db.delete(analysisMetadata).where(eq(analysisMetadata.analysisId, analysisId));
    } catch (error) {
      console.error('Error deleting analysis metadata:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
