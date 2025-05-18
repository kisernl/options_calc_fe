import { defineConfig } from 'cypress';
import { devServer } from '@cypress/vite-dev-server';

// https://docs.cypress.io/guides/component-testing/quickstart-react
// https://docs.cypress.io/guides/component-testing/framework-configuration#Vite-React

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
