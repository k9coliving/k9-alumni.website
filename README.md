# K9 Alumni Website

Whether you've been a K9er for a few months or many years, moving out is never easy. We are on a journey to build a strong alumni network, so the K9 magic lives on, outside the walls of the house.

This is a password-protected alumni community website built with Next.js, TypeScript, and Tailwind CSS.

> **Note**: This project is shared publicly to take advantage of free hosting tiers (Vercel's Next.js free tier). It is not intended as a reusable open source project and will not be maintained as such. The code is specific to our K9 alumni community needs.

## Features

- **Password Protection**: Secure access with shared password authentication
- **Session Management**: JWT-based authentication that persists across browser sessions
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Airtable Integration**: Uses shared view API for seamless data access without authentication

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
   - `AIRTABLE_BASE_ID`: Your Airtable base ID (e.g., `appXx1AbC2DeFgH3I`)
   - `AIRTABLE_*_VIEW_ID`: Shared view IDs for each section (e.g., `viwXx1AbC2DeFgH3I`)
   - `AIRTABLE_*_SHARE_ID`: Share IDs for each view (e.g., `shrXx1AbC2DeFgH3I`)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

## Project Structure

```
src/
├── app/
│   ├── api/auth/          # Authentication API endpoint
│   ├── layout.tsx         # Root layout with auth provider
│   └── page.tsx          # Home page
├── components/
│   ├── AuthProvider.tsx   # Client-side auth state management
│   └── PasswordGate.tsx   # Password entry form
└── lib/
    ├── auth.ts           # Server-side auth utilities
    └── airtable.ts       # Airtable shared view API client
```

## Development Phases

This project follows a structured development plan:

- **✅ Phase 1**: Project Setup & Authentication (Current)
- **🚧 Phase 2**: Core Layout & Navigation  
- **⏳ Phase 3**: Page Components (Priority Order)
- **⏳ Phase 4**: Remaining Pages
- **⏳ Phase 5**: Integration & Polish

See `development-plan.md` for detailed roadmap.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SITE_PASSWORD` | Yes | Shared password for site access |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID (from shared view URLs) |
| `AIRTABLE_*_VIEW_ID` | Yes | Shared view IDs for each section |
| `AIRTABLE_*_SHARE_ID` | Yes | Share IDs for each shared view |
| `AIRTABLE_ONBOARDING_FORM_ID` | Yes | Form ID for onboarding/database registration |

### Extracting Airtable IDs

From a shared view URL like your curl request, extract:
- **Base ID**: `appXx1AbC2DeFgH3I` (from `applicationId` or `x-airtable-application-id`)
- **View ID**: `viwXx1AbC2DeFgH3I` (from the URL path)
- **Share ID**: `shrXx1AbC2DeFgH3I` (from `shareId` in the access policy)

## Security

- JWT-based authentication prevents cookie manipulation
- Environment variables are gitignored
- HTTP-only cookies for session management
- Secure token validation on server-side

## Credits

- **Illustrations**: [Storyset](https://storyset.com) - Profile placeholder graphics

## Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to add your environment variables in the Vercel dashboard.