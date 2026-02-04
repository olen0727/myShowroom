# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Showroom is a personal portfolio website with an admin dashboard. Built with Next.js 14 (App Router), TypeScript, Supabase, and NextUI. The interface is primarily in Traditional Chinese.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm start        # Run production server
npm run lint     # ESLint check
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Database/Auth/Storage**: Supabase (PostgreSQL + Auth + Storage buckets)
- **UI**: NextUI components + Tailwind CSS (dark theme default)
- **Rich Text Editor**: Plate (WYSIWYG editor for project content)
- **Animations**: Framer Motion + GSAP
- **Drag & Drop**: @dnd-kit for sortable lists

### Key Directories
- `src/app/(site)/` - Public-facing pages
- `src/app/admin/` - Admin dashboard routes (wrapped in AdminShell for auth)
- `src/components/admin/` - Admin-specific components
- `src/components/editor/` - Plate editor UI components
- `src/lib/supabase.ts` - Supabase client initialization
- `src/types/index.ts` - TypeScript interfaces

### Data Flow
- Components fetch data directly from Supabase client-side
- All tables use Row-Level Security (RLS)
- Auth via Supabase Authentication (email/password)
- `AdminShell` component handles auth checks and redirects

### Database Tables
- `profile` - Personal info, hero section config
- `projects` - Portfolio projects (content stored as Plate JSON)
- `carousel_projects` - Featured carousel items
- `project_tag_colors` - Shared tag color definitions
- `experience`, `skills`, `social_links`, `messages`

### Storage Buckets
- `project-images/` - Project images (subdirectory `content/` for editor uploads)
- `carousel-images/` - Carousel images

## Code Patterns

### Imports
Always use path alias: `@/components`, `@/lib`, `@/types`

### Component Structure
- All interactive components require `'use client'` directive
- CSS Modules for component-specific styles (e.g., `Hero.module.css`)
- Admin pages are wrapped in `AdminShell` for authentication

### Supabase Usage
```tsx
import { supabase } from '@/lib/supabase';

// Fetch
const { data, error } = await supabase.from('table').select('*');

// Upsert
await supabase.from('table').upsert({ /* data */ });
```

### Toast Notifications
```tsx
import { toast } from 'sonner';
toast.success('Success');
toast.error('Error');
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Adding Admin Features

1. Create route at `src/app/admin/[section]/page.tsx`
2. Create tab component at `src/components/admin/[Section]Tab.tsx`
3. Wrap in AdminShell and add to `adminTabs` array in `AdminShell.tsx`
