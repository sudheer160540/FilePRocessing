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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
  }

  // Video analysis operations
  async createVideoAnalysis(analysis: InsertVideoAnalysis): Promise<VideoAnalysis> {
    const [result] = await db.insert(videoAnalyses).values(analysis).returning();
    return result;
  }

  async getVideoAnalysis(id: number): Promise<VideoAnalysis | undefined> {
    const [analysis] = await db.select().from(videoAnalyses).where(eq(videoAnalyses.id, id));
    return analysis;
  }

  async getUserVideoAnalyses(userId: string): Promise<VideoAnalysis[]> {
    return await db
      .select()
      .from(videoAnalyses)
      .where(eq(videoAnalyses.userId, userId))
      .orderBy(desc(videoAnalyses.createdAt));
  }

  async updateVideoAnalysis(id: number, updates: Partial<VideoAnalysis>): Promise<VideoAnalysis> {
    const [result] = await db
      .update(videoAnalyses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoAnalyses.id, id))
      .returning();
    return result;
  }

  async deleteVideoAnalysis(id: number): Promise<void> {
    await db.delete(videoAnalyses).where(eq(videoAnalyses.id, id));
  }

  // Key frame operations
  async createKeyFrame(keyFrame: InsertKeyFrame): Promise<KeyFrame> {
    const [result] = await db.insert(keyFrames).values(keyFrame).returning();
    return result;
  }

  async getKeyFramesByAnalysis(analysisId: number): Promise<KeyFrame[]> {
    return await db
      .select()
      .from(keyFrames)
      .where(eq(keyFrames.analysisId, analysisId))
      .orderBy(keyFrames.timestamp);
  }

  async deleteKeyFramesByAnalysis(analysisId: number): Promise<void> {
    await db.delete(keyFrames).where(eq(keyFrames.analysisId, analysisId));
  }

  // Analysis metadata operations
  async createAnalysisMetadata(metadata: InsertAnalysisMetadata): Promise<AnalysisMetadata> {
    const [result] = await db.insert(analysisMetadata).values(metadata).returning();
    return result;
  }

  async getAnalysisMetadata(analysisId: number): Promise<AnalysisMetadata[]> {
    return await db
      .select()
      .from(analysisMetadata)
      .where(eq(analysisMetadata.analysisId, analysisId));
  }

  async deleteAnalysisMetadata(analysisId: number): Promise<void> {
    await db.delete(analysisMetadata).where(eq(analysisMetadata.analysisId, analysisId));
  }
}

export const storage = new DatabaseStorage();
