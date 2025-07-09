# Video Analysis Application

## Overview

This is a full-stack video analysis application built with React (frontend) and Express.js (backend). The application allows authenticated users to upload videos or provide YouTube URLs, automatically extracts key frames with timestamps, and generates Word document reports with analysis summaries.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **File Upload**: Multer for handling video file uploads
- **Video Processing**: FFmpeg for video analysis and frame extraction
- **Document Generation**: HTML-based reports (convertible to Word format)

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Session Management**: PostgreSQL session store with express-session
- **Protected Routes**: Middleware-based route protection
- **User Management**: Complete user CRUD operations

### Video Processing Pipeline
- **Upload Handling**: Multi-format video support (MP4, AVI, MOV, MKV)
- **YouTube Integration**: URL-based video processing with yt-dlp
- **Frame Extraction**: Automated key frame detection with timestamps
- **Analysis Storage**: Structured data storage for processing results

### Database Schema
- **Users**: Authentication and profile information
- **Video Analyses**: Core analysis metadata and status tracking
- **Key Frames**: Extracted frame data with timestamps and descriptions
- **Analysis Metadata**: Additional processing information
- **Sessions**: Authentication session persistence

### Frontend Pages and Components
- **Landing Page**: Public marketing page with authentication
- **Home Dashboard**: Authenticated user welcome and navigation
- **Upload Interface**: Tabbed interface for file upload or YouTube URL
- **Processing View**: Real-time progress tracking with status updates
- **Results Display**: Analysis results with download functionality
- **Dashboard**: Historical analysis management

## Data Flow

1. **Authentication**: User authenticates via Replit Auth
2. **Video Input**: User uploads file or provides YouTube URL
3. **Processing Queue**: Analysis job created with "pending" status
4. **Video Analysis**: Backend processes video, extracts frames, generates metadata
5. **Report Generation**: HTML report created with frames and analysis
6. **Results Display**: Frontend shows completed analysis with download option
7. **Storage**: All data persisted in PostgreSQL database

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless PostgreSQL)
- **Authentication**: Replit Auth service
- **Video Processing**: FFmpeg (system dependency)
- **YouTube Processing**: yt-dlp (system dependency)

### Key Libraries
- **Frontend**: React, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Drizzle ORM, Multer, Passport.js
- **Database**: Neon serverless PostgreSQL driver
- **UI Components**: Radix UI primitives with custom styling

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Neon PostgreSQL cloud instance
- **File Storage**: Local filesystem for uploads and outputs

### Production Build
- **Frontend**: Vite production build to static files
- **Backend**: ESBuild bundling for Node.js deployment
- **Static Serving**: Express serves frontend build in production
- **Environment**: Replit hosting with integrated authentication

### File Structure
```
/client - React frontend application
/server - Express backend application  
/shared - Shared TypeScript types and schemas
/uploads - Temporary video file storage
/outputs - Processed frame storage
/reports - Generated report storage
/migrations - Database migration files
```

The application uses a monorepo structure with clearly separated frontend and backend concerns, shared type definitions, and integrated build processes for seamless development and deployment.