import { test, expect } from '@playwright/test'

/**
 * Protected Pages Access Test - Verifies authenticated users can access key protected pages
 *
 * This check:
 * 1. Authenticates with valid password
 * 2. Navigates to a sample of key pages (Events, Tips, Hold my Hair)
 * 3. Verifies each page loads successfully
 * 4. Confirms pages are accessible after authentication
 *
 * Note: Testing a representative sample of pages to keep test duration reasonable
 * Other pages (K9 Family, Who Are We, Newsletter) are tested separately or covered by homepage test
 *
 * Schedule: Runs daily at 19:00 CET (18:00 UTC)
 * Failure Impact: HIGH - Core functionality broken
 */

test('All protected pages are accessible after authentication', async ({ page }) => {
  const baseUrl = process.env.PRODUCTION_URL || 'https://k9-alumniwebsite.vercel.app'
  const sitePassword = process.env.SITE_PASSWORD

  if (!sitePassword) {
    throw new Error('SITE_PASSWORD environment variable is required for this check')
  }

  // Navigate to homepage and authenticate
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  // Check if password gate is present and authenticate
  const passwordInput = page.locator('input[type="password"]')
  const isPasswordGateVisible = await passwordInput.isVisible()

  if (isPasswordGateVisible) {
    await passwordInput.fill(sitePassword)
    await page.locator('button[type="submit"]').click()
    await page.waitForLoadState('networkidle')

    // Wait for authentication cookie to be set and page to fully load
    await page.waitForTimeout(2000)

    // Verify we're authenticated by checking navigation is visible
    await expect(page.locator('nav')).toBeVisible()
  }

  // Define key protected pages to test (testing a representative sample)
  const protectedPages = [
    { path: '/events', name: 'Events' },
    { path: '/tips', name: 'Tips & Offerings' },
    { path: '/holdmyhair', name: 'Hold my Hair' },
  ]

  // Test each protected page
  for (const pageDef of protectedPages) {
    console.log(`Testing ${pageDef.name} page...`)

    try {
      // Navigate to the page with timeout
      await page.goto(`${baseUrl}${pageDef.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      })

      // Wait a bit for the page to render
      await page.waitForTimeout(2000)
    } catch (error) {
      console.log(`⚠ ${pageDef.name} page navigation timed out, but continuing...`)
      // If navigation timed out but page partially loaded, continue with checks
      await page.waitForTimeout(1000)
    }

    // Check if we need to re-authenticate (password form appeared)
    const passwordInputReappeared = await page.locator('input[type="password"]').isVisible().catch(() => false)
    if (passwordInputReappeared) {
      throw new Error(`${pageDef.name} page requires re-authentication - session may have expired`)
    }

    // Verify page loaded successfully by checking for navigation
    const navVisible = await page.locator('nav').isVisible({ timeout: 3000 }).catch(() => false)
    if (!navVisible) {
      // Try checking for other page content to verify it loaded
      const bodyText = await page.locator('body').textContent()
      if (!bodyText || bodyText.length < 100) {
        throw new Error(`${pageDef.name} page appears to be empty or failed to load`)
      }
      console.log(`⚠ ${pageDef.name} page loaded but navigation not found (may use different layout)`)
    } else {
      console.log(`✓ ${pageDef.name} page loaded with navigation`)
    }

    // Verify we're not on an error page
    const pageTitle = await page.title()
    if (pageTitle.includes('404') || pageTitle.includes('Error')) {
      throw new Error(`${pageDef.name} page returned an error: ${pageTitle}`)
    }

    // Verify URL is correct (not redirected to error page)
    const currentUrl = page.url()
    if (!currentUrl.includes(pageDef.path)) {
      throw new Error(`${pageDef.name} page redirected unexpectedly to: ${currentUrl}`)
    }

    console.log(`✓ ${pageDef.name} page accessible`)
  }

  // Take a final screenshot
  await page.screenshot({ path: 'protected-pages-test.jpg' })

  console.log('All protected pages are accessible')
})
