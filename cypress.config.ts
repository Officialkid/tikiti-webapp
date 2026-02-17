import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Video and screenshot settings
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    // Test pattern
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
