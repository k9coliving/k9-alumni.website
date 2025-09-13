# K9 Alumni Website

Whether you've been a K9er for a few months or many years, moving out is never easy. We are on a journey to build a strong alumni network, so the K9 magic lives on, outside the walls of the house.

This is a password-protected alumni community website built with Next.js, TypeScript, and Tailwind CSS.

> **Note**: This project is shared publicly to take advantage of free hosting tiers (Vercel's Next.js free tier). It is not intended as a reusable open source project and will not be maintained as such. The code is specific to our K9 alumni community needs.

## Features

- **Password Protection**: Secure access with shared password authentication
- **Session Management**: JWT-based authentication that persists across browser sessions
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Supabase Integration**: PostgreSQL database with real-time capabilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in the required values in `.env.local`:
   - `SITE_PASSWORD`: The shared password for site access
   - `JWT_SECRET`: Secret key for JWT token signing (use a secure random string)
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for server-side access
   - `NEXT_PUBLIC_NEWSLETTER_FORM_URL`: URL for newsletter contribution form
   - `NEXT_PUBLIC_NEWSLETTER_LATEST_URL`: URL for latest newsletter

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

## Project Structure

The project follows Next.js App Router conventions with pages in `src/app/`, reusable components in `src/components/`, API routes in `src/app/api/`, and utilities in `src/lib/`. Page-specific components are co-located in the same directory as their page. Authentication, navigation, and all main pages are fully implemented.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SITE_PASSWORD` | Yes | Shared password for site access |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key for client-side access |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key for server-side database access |
| `NEXT_PUBLIC_SUPABASE_STORAGE_URL` | Yes | Base URL for Supabase storage bucket (for images) |
| `NEXT_PUBLIC_NEWSLETTER_FORM_URL` | Yes | URL for newsletter contribution form |
| `NEXT_PUBLIC_NEWSLETTER_LATEST_URL` | Yes | URL for latest newsletter |

## Security

- JWT-based authentication prevents cookie manipulation
- Environment variables are gitignored
- HTTP-only cookies for session management
- Secure token validation on server-side
- Search engine protection: robots.txt and meta tags prevent crawling/indexing

## Credits

- **Illustrations**: [Storyset](https://storyset.com) - Profile placeholder graphics

## Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to add your environment variables in the Vercel dashboard.