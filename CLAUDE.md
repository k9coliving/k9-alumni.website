# K9 Alumni Website - Claude Code Instructions

## Project Overview
This is a password-protected website for K9 alumni. Users need to know one shared password to access the website when they visit initially. The project is currently in early development phase.

## Key Information
- **Project Type**: Password-protected alumni website with shared access password
- **Target Audience**: K9 alumni community
- **Security**: Single shared password protection for initial website access
- **Authentication**: One password grants access to the site, not individual user accounts

## Development Guidelines

### Security Requirements
- Always maintain password protection functionality
- Never expose sensitive alumni data
- Follow security best practices for user authentication
- Ensure all alumni information is properly protected
- **CRITICAL**: This is a PUBLIC REPOSITORY - never commit sensitive data (API keys, passwords, real Airtable IDs, etc.) to GitHub

### Code Conventions
- Follow consistent naming conventions throughout the project
- Use semantic HTML and accessible design patterns
- Implement responsive design for mobile compatibility
- Write clean, maintainable code with proper documentation

### Development Workflow
1. Always check existing code patterns before implementing new features
2. Test password protection functionality after any auth-related changes
3. Ensure responsive design works across devices
4. Validate forms and user inputs properly
5. Run linting and type checking before committing changes
6. **Suggest git commits at suitable points** - proactively recommend committing when logical milestones are reached

## Password Management
- **Password File**: `passwords.json` contains site credentials in structured format
- **Security**: File is gitignored to prevent accidental commits
- **Format**: JSON with name, url, password, description, and created date fields
- **Usage**: Read this file when accessing password-protected sites during development

## Development Status
- **Phase 1**: ✅ Project Setup & Authentication (JWT-based password protection)
- **Phase 2**: ✅ Core Layout & Navigation (Responsive nav with 9 sections, footer)
- **Current**: Ready for Phase 3 - Page Components implementation

## Design Preferences
- **Design Model**: Follow https://madebymom.my.canva.site/k9alumni/#home (see passwords.json) as the style reference
- **Visual Style**: Vibrant, playful, and colorful design - avoid serious/corporate appearance
- **Overall Tone**: "Childish love" aesthetic - warm, friendly, community-focused

## Testing & Preview
- **Dev Server**: Run `npm run dev` to start development server
- **Preview**: Use playwright mcp server to view `http://localhost:3001`
- **Site Password**: See environment variable `SITE_PASSWORD` in .env.local
- **Theme**: Light theme with gray-50 background for better text readability

## Notes for Claude
- This project is for a K9 alumni community website
- Password protection is essential - never compromise security
- Focus on user experience for alumni connecting with each other
- Consider accessibility and mobile-first design
- Always ask for clarification on alumni data handling requirements
- Use playwright browser tools to preview changes during development
- Dev server logs: Use Read tool on `dev.log` or `tail -n 50 dev.log` for recent entries (dev server assumed to be always running)
- **SECURITY REMINDER**: This is a public repository - always use placeholder values in documentation and never commit real API credentials