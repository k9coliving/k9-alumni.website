# Checkly Monitoring Checks

This directory contains Checkly browser checks for monitoring the K9 Alumni Website.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Checkly Credentials
1. Sign up at https://app.checkly.com
2. Get your API key from Settings > API Keys
3. Get your Account ID from Settings > Account

### 3. Configure Environment Variables
Add to your `.env.local`:
```bash
CHECKLY_API_KEY=your_checkly_api_key_here
CHECKLY_ACCOUNT_ID=your_checkly_account_id_here
PRODUCTION_URL=https://your-production-url.vercel.app
SITE_PASSWORD=your_site_password_here
```

### 4. Run Tests Locally
```bash
# Test all checks
npx checkly test

# Test specific check
npx checkly test __checks__/homepage.check.ts

# Run with verbose output
npx checkly test --verbose
```

### 5. Set Environment Variables for Checkly
Environment variables used in your checks need to be added to Checkly separately:

```bash
# Add environment variables to Checkly
npx checkly env add SITE_PASSWORD your_password_value --secret
npx checkly env add PRODUCTION_URL https://your-production-url.vercel.app

# The --secret flag is optional and should be used for sensitive values
# Secret values are encrypted and will never be displayed again after creation
```

### 6. Deploy to Checkly
```bash
# Deploy and record results
npx checkly test --record

# Deploy checks to Checkly dashboard
npx checkly deploy
```

### 7. Configure Alert Channels
**IMPORTANT**: After deploying new checks via CLI, they need to be manually added to alert channels.

Alerts for failing tests are sent to:
- **Email**: Configured in Checkly UI
- **Telegram**: Configured in Checkly UI

To add new checks to alerts:
1. Go to https://app.checkly.com
2. Navigate to **Alert channels** in the left sidebar
3. Select each alert channel (Email and Telegram)
4. Add the newly deployed checks to the alert channel
5. Save changes

**Note**: Checks deployed via CLI are not automatically subscribed to existing alert channels. You must manually add them to ensure you receive alerts for failures.

## Available Checks

### homepage.spec.ts
- **Purpose**: Verifies the homepage loads correctly and password protection works
- **Schedule**: Daily at 19:00 CET (18:00 UTC)
- **Checks**: Password authentication, page title, navigation elements
- **Location**: EU West (Ireland)
- **Critical**: Yes - ensures site is accessible and secure

### invalid-auth.spec.ts
- **Purpose**: Ensures password protection rejects invalid passwords
- **Schedule**: Daily at 19:00 CET (18:00 UTC)
- **Checks**: Invalid password rejection, error handling, security measures
- **Location**: EU West (Ireland)
- **Critical**: Yes - security vulnerability if failing

### protected-pages.spec.ts
- **Purpose**: Verifies authenticated users can access key protected pages
- **Schedule**: Daily at 19:00 CET (18:00 UTC)
- **Checks**: Events, Tips, and Hold my Hair pages are accessible after authentication
- **Location**: EU West (Ireland)
- **Critical**: High - core functionality

### k9family-directory.spec.ts
- **Purpose**: Tests that the K9 Family alumni directory loads and functions correctly
- **Schedule**: Daily at 19:00 CET (18:00 UTC)
- **Checks**: Directory loads, resident cards display, search functionality, card interaction
- **Location**: EU West (Ireland)
- **Critical**: High - core feature of the site

## Adding New Checks

1. Create a new file in this directory: `your-check-name.spec.ts`
2. Use Playwright's test syntax with `@playwright/test`
3. Run `npx checkly test` to verify it works locally
4. Deploy with `npx checkly deploy`

Example:
```typescript
import { test, expect } from '@playwright/test'

test('My check description', async ({ page }) => {
  const baseUrl = process.env.PRODUCTION_URL || 'https://your-site.com'

  await page.goto(baseUrl)
  await expect(page.locator('h1')).toBeVisible()

  // Take a screenshot for debugging
  await page.screenshot({ path: 'my-check-screenshot.jpg' })
})
```

## CI/CD Integration

Add to your GitHub Actions workflow:
```yaml
- name: Run Checkly checks
  env:
    CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
    CHECKLY_ACCOUNT_ID: ${{ secrets.CHECKLY_ACCOUNT_ID }}
    PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}
    SITE_PASSWORD: ${{ secrets.SITE_PASSWORD }}
  run: npx checkly test --record
```

## Documentation
- [Checkly CLI Docs](https://www.checklyhq.com/docs/cli/)
- [Browser Check Reference](https://www.checklyhq.com/docs/browser-checks/)
- [Playwright API](https://playwright.dev/docs/api/class-page)
