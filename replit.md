# Social Planner Pro

## Overview

Social Planner Pro is a professional social media planning and scheduling application. It enables users to create, schedule, and manage posts across multiple platforms (LinkedIn, Instagram, Facebook) with features including a visual calendar, Kanban workflow view, content templates, and analytics dashboard. The application aims to streamline social media management with smart cross-platform content adaptation and real-time mobile previews.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Drag & Drop**: @dnd-kit for Kanban board functionality
- **Calendar**: react-big-calendar with date-fns localization (French)
- **Charts**: Recharts for analytics visualizations
- **Forms**: React Hook Form with Zod validation

### Backend Architecture

- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Design**: RESTful JSON API under `/api` prefix
- **Build System**: Custom build script using esbuild for server bundling and Vite for client

### Data Storage

- **Database**: Supabase (PostgreSQL)
- **Project ID**: dmiwrsoydpnhpyzmoszu
- **Region**: EU West (eu-west-1)
- **Client**: @supabase/supabase-js
- **Schema Location**: `shared/schema.ts` contains type definitions
- **Storage Layer**: `server/storage.ts` implements Supabase client operations
- **Tables**: 
  - `posts`: Social media posts with content, image, video, type, date, platforms array, status, created_at

### Project Structure

```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route page components
│   ├── lib/             # Utilities and API client
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   └── db.ts            # Database connection
├── shared/              # Shared code between client/server
│   └── schema.ts        # Drizzle schema definitions
└── migrations/          # Database migrations
```

### Key Design Patterns

- **Shared Schema**: Drizzle schema in `shared/` provides type safety across client and server
- **Storage Abstraction**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **API Layer**: Client-side API functions in `client/src/lib/api.ts` wrap fetch calls
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared directory

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe queries and migrations

### UI Framework
- Radix UI primitives for accessible components
- Tailwind CSS v4 with @tailwindcss/vite plugin
- Lucide React for icons

### Key Libraries
- TanStack React Query for data fetching
- date-fns for date manipulation (French locale)
- Zod for runtime validation
- react-hook-form for form handling
- react-big-calendar for calendar views
- @dnd-kit for drag-and-drop Kanban
- Recharts for analytics charts

### Development Tools
- Vite dev server with HMR
- Replit-specific plugins (error overlay, cartographer, dev banner)
- TypeScript with strict mode