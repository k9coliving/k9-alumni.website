import { test, expect } from '@playwright/test'

/**
 * Homepage Check - Verifies the K9 Alumni Website homepage loads correctly
 *
 * This check:
 * 1. Visits the homepage
 * 2. Tests password protection authentication
 * 3. Verifies the page title is correct
 * 4. Checks that key navigation elements are present
 *
 * Schedule: Runs daily at 19:00 CET (18:00 UTC)
 */

test('K9 Alumni Homepage loads correctly', async ({ page }) => {
  // Set the base URL (update with your production URL)
  const baseUrl = process.env.PRODUCTION_URL || 'https://k9-alumni.vercel.app'
  const sitePassword = process.env.SITE_PASSWORD

  if (!sitePassword) {
    throw new Error('SITE_PASSWORD environment variable is required for this check')
  }

  // Navigate to homepage
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  // First check if password gate is present
  const passwordInput = page.locator('input[type="password"]')
  const isPasswordGateVisible = await passwordInput.isVisible()

  if (isPasswordGateVisible) {
    // If password gate is present, authenticate first
    await passwordInput.fill(sitePassword)
    await page.locator('button[type="submit"]').click()
    await page.waitForLoadState('networkidle')
  }

  // Check page title
  await expect(page).toHaveTitle(/K9 Alumni/)

  // Verify key elements are present
  await expect(page.locator('nav')).toBeVisible()

  // Take a screenshot for debugging
  await page.screenshot({ path: 'homepage-screenshot.jpg' })
})
