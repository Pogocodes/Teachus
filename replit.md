# Learning Platform Application

## Overview

This is a full-stack learning platform application built with React, Express, TypeScript, and PostgreSQL. The platform connects students with instructors for both online and offline courses, featuring course browsing, instructor profiles, booking systems, and dashboards for both student and instructor roles.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Progress Update

**Date: July 24, 2025**
- User feedback: 80% of core learning platform vision is successfully implemented
- All critical runtime errors resolved and application now fully functional
- Complete homepage with search, categories, and course discovery working
- Student and instructor dashboards operational
- Booking system and course browsing implemented
- Next phase: Complete remaining 20% to exceed existing platforms like UrbanPro

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query (@tanstack/react-query) for server state
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Style**: REST API with JSON responses
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based sessions using connect-pg-simple

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`

## Key Components

### Database Schema
The application uses a comprehensive schema with the following main entities:
- **Users**: Core user authentication and profile data
- **Categories**: Course categorization system
- **Instructors**: Extended instructor profiles with ratings and specialties
- **Courses**: Course content with pricing, difficulty levels, and metadata
- **Enrollments**: Student-course relationships
- **Bookings**: Session scheduling between students and instructors
- **Reviews**: Rating and feedback system
- **Messages**: Communication system (structure defined)

### Authentication System
- Simple email/password authentication
- Role-based access control (student/instructor)
- Session-based authentication without complex JWT implementation

### UI Components
- Comprehensive shadcn/ui component library integration
- Custom components for course cards, instructor profiles, and booking interfaces
- Responsive design with mobile-first approach
- Dark mode support built into the design system

### API Structure
RESTful endpoints organized by feature:
- `/api/auth/*` - Authentication endpoints
- `/api/courses/*` - Course management
- `/api/instructors/*` - Instructor profiles and search
- `/api/bookings/*` - Session booking system
- `/api/categories/*` - Course categories
- `/api/enrollments/*` - Course enrollment management
- `/api/reviews/*` - Review and rating system

## Data Flow

1. **Authentication Flow**: Users register/login through simple form-based authentication stored in PostgreSQL sessions
2. **Course Discovery**: Students browse courses by categories, search terms, or instructor profiles
3. **Booking Process**: Students can book sessions with instructors for both online and offline learning
4. **Dashboard Systems**: Separate dashboards for students (tracking enrollments, bookings) and instructors (managing courses, viewing bookings)
5. **Review System**: Students can leave reviews for courses and instructors after completion

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Uses `@neondatabase/serverless` for database connectivity

### UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Replit Integration**: Configured for Replit development environment
- **Vite Plugins**: Runtime error overlay and cartographer for enhanced development experience

## Deployment Strategy

### Development
- Uses Vite dev server for frontend with HMR (Hot Module Replacement)
- Express server runs concurrently serving API routes
- TypeScript compilation with strict mode enabled
- Development-specific error handling and logging

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command
- **Environment**: Expects `DATABASE_URL` environment variable for PostgreSQL connection

### Architecture Decisions

1. **Monorepo Structure**: Frontend (`client/`), backend (`server/`), and shared code (`shared/`) in single repository for easier development and type sharing

2. **Type Safety**: Comprehensive TypeScript usage with shared types between frontend and backend, Drizzle ORM for database type safety

3. **Component Architecture**: shadcn/ui provides consistent, accessible components while allowing customization through Tailwind CSS

4. **State Management**: React Query handles all server state, eliminating need for complex global state management

5. **Database Design**: Normalized schema with proper relationships, supporting both course enrollment and individual session booking models

6. **Session-based Auth**: Simple session-based authentication stored in PostgreSQL for easier development and deployment