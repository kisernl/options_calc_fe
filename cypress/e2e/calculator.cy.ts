/// <reference types="cypress" />

describe('Options Calculator', () => {
    // Mock API responses
    const mockStockData = {
      symbol: 'AAPL',
      price: 175.34,
      name: 'Apple Inc.'
    };
  
    const mockOptionChain = [
      {
        id: 'AAPL123',
        symbol: 'AAPL',
        expiration_date: '2023-12-31',
        strike_price: 170,
        type: 'call',
        option_type: 'call',
        premium: 5.67,
        side: 'buy',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'AAPL124',
        symbol: 'AAPL',
        expiration_date: '2023-12-31',
        strike_price: 175,
        type: 'call',
        option_type: 'call',
        premium: 5.67,
        side: 'buy',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  
    beforeEach(() => {
      // Set up API key in localStorage before each test
      window.localStorage.setItem('alpaca_api_key', 'test-api-key');
      window.localStorage.setItem('alpaca_api_secret', 'test-api-secret');
  
      // Mock the stock price API - match the format expected by the component
      cy.intercept('GET', '**/v2/stocks/trades/latest*', {
        statusCode: 200,
        body: {
          trades: {
            [mockStockData.symbol]: {
              p: mockStockData.price,
              s: mockStockData.symbol,
              t: new Date().toISOString(),
              i: 12345
            }
          }
        }
      }).as('getStockPrice');
  
      // Mock the options chain API - match the format expected by the component
      cy.intercept('GET', '**/v2/options/contracts*', {
        statusCode: 200,
        body: mockOptionChain
      }).as('getOptionChain');

      cy.visit('/');
      // Wait for the page to be fully loaded
      cy.get('input[placeholder*="Enter stock symbol"]').should('be.visible');
    });
  
    it('should load the calculator page', () => {
      cy.title().should('include', 'Options Calculator');
      cy.contains('h2', 'Cash Secured Put Calculator').should('be.visible');
    });
  
    it('should switch between put and call calculators', () => {
      // Default should be PUT
      cy.contains('button', 'Cash Secured Put').should('have.class', 'border-blue-600');
      
      // Switch to CALL
      cy.contains('button', 'Covered Call').click();
      cy.contains('h2', 'Covered Call Calculator').should('be.visible');
      cy.contains('button', 'Covered Call').should('have.class', 'border-blue-600');
      
      // Switch back to PUT
      cy.contains('button', 'Cash Secured Put').click();
      cy.contains('h2', 'Cash Secured Put Calculator').should('be.visible');
    });
  
    it('should allow entering and searching for a stock', () => {
      // Type in the stock symbol
      cy.get('input[placeholder*="Enter stock symbol"]')
        .type('AAPL', { delay: 100 })
        .should('have.value', 'AAPL');
      
      // Click the submit button
      cy.get('button[type="submit"]')
        .should('be.visible')
        .click({ force: true });
      
      // Wait for the stock price API call
      cy.wait('@getStockPrice');
      
      // Wait for the options chain API call
      cy.wait('@getOptionChain');
      
      // Check if the current price is displayed
      cy.contains('.text-gray-800', mockStockData.price.toFixed(2), { timeout: 10000 })
        .should('be.visible');
    });
  
    it('should allow selecting expiration date after stock is selected', () => {
      // First, search for a stock
      cy.get('input[placeholder*="Enter stock symbol"]').type('AAPL');
      cy.get('form').first().submit();
      
      // Wait for the stock price API call
      cy.wait('@getStockPrice');
      
      // Wait for the options chain to load
      cy.wait('@getOptionChain');
      
      // The date picker should now be enabled
      cy.get('input[type="date"]', { timeout: 10000 })
        .should('be.visible')
        .and('not.have.attr', 'disabled');
    });
  
    it('should show validation errors for required fields', () => {
      // Try to submit without entering a symbol
      cy.get('form').first().submit();
      
      // Should show validation error
      cy.contains('Stock symbol is required').should('be.visible');
    });
  
    it('should reset the form', () => {
      // First, search for a stock
      cy.get('input[placeholder*="Enter stock symbol"]').type('AAPL');
      cy.get('form').first().submit();
      
      // Wait for the stock price API call
      cy.wait('@getStockPrice');
      
      // Wait for the options chain API call
      cy.wait('@getOptionChain');
      
      // Click the reset button
      cy.get('button')
        .contains('Reset')
        .should('be.visible')
        .click({ force: true });
      
      // Wait for the reset to complete
      cy.wait(1000);
      
      // Verify the input is cleared
      cy.get('input[placeholder*="Enter stock symbol"]')
        .should('have.value', '');
      
      // Verify the current price is not visible
      cy.contains('.text-gray-800', mockStockData.price.toFixed(2))
        .should('not.exist');
    });
  
    it('should show API key modal', () => {
      // Find and click the API button - use force:true in case it's not immediately clickable
      cy.contains('button', 'API').click({ force: true });
      
      // The modal should be visible - check for the modal content
      cy.contains('Alpaca API Settings').should('be.visible');
      
      // Close the modal - use the close button
      cy.get('button').contains('Cancel').click({ force: true });
      
      // The modal should be gone
      cy.contains('Alpaca API Settings').should('not.exist');
    });
  });