// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Add any custom command types here
declare global {
  namespace Cypress {
    interface Chainable {
      // Custom command to fill out the options calculator form
      fillCalculatorForm(params: {
        optionType: 'CALL' | 'PUT';
        stockPrice: number;
        strikePrice: number;
        premium: number;
        expirationDate: string;
        contracts?: number;
      }): Chainable<void>;
    }
  }
}

// Example custom command
// Cypress.Commands.add('fillCalculatorForm', (params) => {
//   // Implementation here
// });

// Convert this to a module to be able to extend the global Cypress namespace
export {};
