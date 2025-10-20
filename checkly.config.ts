import { defineConfig } from 'checkly'

/**
 * Checkly configuration for K9 Alumni Website
 * This configures monitoring checks for the production website
 */
const config = defineConfig({
  projectName: 'K9 Alumni Website',
  logicalId: 'k9-alumni-website',
  repoUrl: 'https://github.com/yourusername/k9-alumni-website', // Update with your actual repo URL

  // Check defaults - applied to all checks
  checks: {
    // Run once daily at 19:00 CET (18:00 UTC in winter, 17:00 UTC in summer)
    // Note: Frequency and scheduling are configured per-check in the spec files
    // Locations where checks run from (European location)
    locations: ['eu-west-1'],

    // Tags for organizing checks
    tags: ['website', 'production'],

    // Alert settings
    alertChannels: [],

    // Checkly Monitoring & Alerting defaults
    runtimeId: '2024.02',

    // Browser check defaults
    browserChecks: {
      testMatch: '**/__checks__/**/*.spec.ts',
    },
  },

  // CLI configuration
  cli: {
    runLocation: 'eu-west-1',
  },
})

export default config
