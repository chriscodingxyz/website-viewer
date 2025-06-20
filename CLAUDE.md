# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Testing
This project does not currently have a test suite configured.

## Architecture

This is a **Website Viewer** application built with Next.js 14 that allows users to view websites in different device viewport sizes (desktop, tablet, large mobile, mobile). The app uses the App Router with TypeScript.

### Key Components Structure

**Main Application Flow:**
- `app/page.tsx` → `WebsiteViewer` → `WebsiteView` (for each viewport)
- Layout wraps everything with theme, favorites, and history providers

**Core Components:**
- `WebsiteViewer` - Main interface with URL input and view management
- `WebsiteView` - Individual iframe containers with viewport-specific sizing
- `Header`/`Footer` - Layout components with theme toggle

**Context Providers:**
- `FavoritesContext` - Manages favorite URLs with localStorage persistence
- `HistoryContext` - Tracks recently viewed URLs (max 10 items)
- `ThemeProvider` - Dark/light mode using next-themes

### Viewport Configuration

The app supports 4 viewport types with specific dimensions:
- `desktop`: 1024×768px
- `tablet`: 768×1024px  
- `mobileLarge`: 640×1000px (just under Tailwind's sm: breakpoint)
- `mobile`: 375×667px (iPhone SE standard)

Views are automatically scaled to fit container width while maintaining aspect ratio.

### State Management

- **Favorites**: Stored in localStorage, includes default localhost URLs
- **History**: Recent URLs (max 10), stored in localStorage
- **Views**: Component state array with unique IDs for each viewport instance

### UI Framework

Uses **shadcn/ui** components with:
- Radix UI primitives for accessible components
- Tailwind CSS for styling with custom CSS variables
- Phosphor Icons for the footer social icons
- Lucide React for UI icons
- Sonner for toast notifications

### Styling Notes

- Uses IBM Plex Mono font for monospace aesthetic
- 16px input font size to prevent mobile zoom
- Custom CSS animation for URL input highlighting
- Responsive design with mobile-first approach
- Minimalistic design with subtle colors and reduced visual clutter
- Clean header without shadow, using backdrop blur for modern look

### URL Handling

- Automatic protocol detection (adds https:// for regular domains, http:// for localhost)
- Validation for both standard URLs and localhost development servers
- URL formatting and validation in `WebsiteViewer.tsx:39-71`

### User Interaction

- **Enter key**: Loads all viewport types (desktop, tablet, mobileLarge, mobile) at once
- **URL suggestions**: Shows recent history, favorites, and common dev ports
- **Responsive UI**: Optimized for both desktop and mobile usage
- **Minimalistic controls**: Clean interface with subtle hover states