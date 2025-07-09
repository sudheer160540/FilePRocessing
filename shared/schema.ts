import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video analysis table
export const videoAnalyses = pgTable("video_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  youtubeUrl: text("youtube_url"),
  duration: integer("duration"), // in seconds
  resolution: text("resolution"),
  format: text("format"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  keyFramesCount: integer("key_frames_count"),
  reportPath: text("report_path"),
  errorMessage: text("error_message"),
  processingStarted: timestamp("processing_started"),
  processingCompleted: timestamp("processing_completed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Key frames table
export const keyFrames = pgTable("key_frames", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").references(() => videoAnalyses.id).notNull(),
  timestamp: integer("timestamp").notNull(), // in seconds
  imagePath: text("image_path").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analysis metadata table
export const analysisMetadata = pgTable("analysis_metadata", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").references(() => videoAnalyses.id).notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertVideoAnalysis = typeof videoAnalyses.$inferInsert;
export type VideoAnalysis = typeof videoAnalyses.$inferSelect;

export type InsertKeyFrame = typeof keyFrames.$inferInsert;
export type KeyFrame = typeof keyFrames.$inferSelect;

export type InsertAnalysisMetadata = typeof analysisMetadata.$inferInsert;
export type AnalysisMetadata = typeof analysisMetadata.$inferSelect;

// Insert schemas
export const insertVideoAnalysisSchema = createInsertSchema(videoAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKeyFrameSchema = createInsertSchema(keyFrames).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisMetadataSchema = createInsertSchema(analysisMetadata).omit({
  id: true,
  createdAt: true,
});

// Additional validation schemas
export const uploadVideoSchema = z.object({
  file: z.instanceof(File).optional(),
  youtubeUrl: z.string().url().optional(),
}).refine(data => data.file || data.youtubeUrl, {
  message: "Either file or YouTube URL is required",
});

export const youtubeUrlSchema = z.object({
  youtubeUrl: z.string().url(),
});
