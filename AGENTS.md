# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Testing
This project does not currently have a test suite configured.

## Architecture

This is a **Website Viewer** application built with Next.js 14 that allows users to view websites in different device viewport sizes and analyze their metadata, SEO, and technical details. The app uses the App Router with TypeScript and features a comprehensive analysis system.

### Key Components Structure

**Main Application Flow:**
- `app/page.tsx` → `WebsiteViewer` → Tabbed interface with `ViewportsSection` and `AnalysisSection`
- Layout wraps everything with multiple context providers (Theme, Favorites, History, WebsiteViewer)

**Core Components:**
- `WebsiteViewer` - Main interface with URL input and global controls
- `WebsiteView` - Individual iframe containers with viewport-specific sizing and smart blocking detection
- `ViewportsSection` - Container for all viewport displays
- `AnalysisSection` - Container for metadata analysis and SEO tools
- `Header`/`Footer` - Layout components with branding
- `SectionContainer` - Reusable container with consistent styling

**Context Providers:**
- `WebsiteViewerContext` - **Primary state manager** for URL, views, zoom, metadata, and iframe detection
- `FavoritesContext` - Manages favorite URLs with localStorage persistence
- `HistoryContext` - Tracks recently viewed URLs (max 10 items)  
- `ThemeProvider` - Dark/light mode using next-themes

**Analysis Components (`components/metadata/`):**
- `MetadataPanel` - Main collapsible panel with tabs for different analysis types
- `OverviewDashboard` - Quick overview of key metrics and status
- `SEOSection` - SEO analysis with title, description, keywords, etc.
- `SocialPreview` - Open Graph and Twitter card previews
- `TechnicalSection` - Technical metadata, headers, analytics detection
- `PerformanceSection` - Performance metrics and recommendations

### API Routes

**Server-side data fetching:**
- `/api/metadata` - Comprehensive website metadata extraction using Cheerio and Axios
- `/api/og-check` - Open Graph and social media validation

### Services Layer

**IframeDetectionService (`services/IframeDetectionService.ts`):**
- Smart detection of iframe blocking using multiple methods
- Preflight checks, iframe load monitoring, and fallback handling
- Status tracking: `'ready' | 'loading' | 'loaded' | 'blocked' | 'error' | 'timeout'`
- Confidence levels and detailed error reporting

### Type System

**Comprehensive TypeScript definitions (`types/metadata.ts`):**
- `WebsiteMetadata` - Complete metadata structure with Zod validation
- `SEOMetadata` - Title, description, keywords, robots, etc.
- `OpenGraphSchema` - Full OG tag support
- `TwitterCardSchema` - Twitter card metadata
- `TechnicalInfo` - Server headers, analytics, performance data
- `SitemapInfo` - Sitemap discovery and validation

### Viewport Configuration

The app supports 4 viewport types with specific dimensions:
- `desktop`: 1024×768px
- `tablet`: 768×1024px  
- `mobileLarge`: 640×1000px (just under Tailwind's sm: breakpoint)
- `mobile`: 375×667px (iPhone SE standard)

Views are automatically scaled to fit container width while maintaining aspect ratio.

### State Management

**WebsiteViewerContext manages:**
- **Current URL** and validation
- **Views array** with iframe status and detection results
- **Global zoom** controls with predefined steps
- **Metadata** loading, caching, and error states
- **Tab state** (viewports vs analysis)

**Persisted state:**
- **Favorites**: Stored in localStorage with default localhost URLs
- **History**: Recent URLs (max 10) with localStorage persistence

### UI Framework

Uses **shadcn/ui** components with:
- Radix UI primitives for accessible components
- Tailwind CSS for styling with custom CSS variables
- Phosphor Icons for footer social icons
- Lucide React for UI icons
- Sonner for toast notifications
- Inter font for modern, clean typography

### Styling Notes

- **Inter font** for clean, modern aesthetic (switched from IBM Plex Mono)
- 16px input font size to prevent mobile zoom
- **Accordion-based design** for collapsible sections
- **Tabbed interface** for organized content sections
- **Compact design** with efficient space usage
- Responsive design with mobile-first approach
- Clean header without shadow, using backdrop blur
- Consistent card-based layout with subtle shadows

### URL Handling & Smart Detection

- Automatic protocol detection (adds https:// for regular domains, http:// for localhost)
- **Smart iframe blocking detection** with multiple fallback methods
- **Metadata fetching** with comprehensive error handling
- URL validation for standard URLs and localhost development servers
- **Retry mechanisms** for failed requests

### User Interaction

**Enhanced Interface:**
- **Tabbed navigation** between Viewports and Analysis sections
- **Global zoom controls** with toast feedback
- **Collapsible metadata panels** with export/copy functionality
- **Smart URL suggestions** with history, favorites, and dev ports
- **Real-time iframe status** with visual indicators
- **Responsive tabbed layout** optimized for desktop and mobile
- **One-click metadata actions** (copy, export, refresh)

### Analytics & Monitoring

- **Google Analytics 4** integration with privacy-focused configuration
- **Performance tracking** for metadata fetching
- **Error monitoring** for iframe detection and API calls
- **User interaction tracking** with anonymized data