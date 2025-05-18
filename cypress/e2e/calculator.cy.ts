/// <reference types="cypress" />

describe('Options Calculator', () => {
    // Mock API responses
    const mockStockData = {
      symbol: 'AAPL',
      price: 175.34,
      name: 'Apple Inc.'
    };
  
    const mockOptionChain = {
      contracts: [
        {
          id: 'AAPL123',
          symbol: 'AAPL',
          expiration_date: '2023-12-31',
          strike_price: 170,
          option_type: 'call',
          premium: 5.67
        },
        {
          id: 'AAPL124',
          symbol: 'AAPL',
          expiration_date: '2023-12-31',
          strike_price: 175,
          option_type: 'call',
          premium: 3.45
        }
      ]
    };
  
    beforeEach(() => {
      // Set up API key in localStorage before each test
      window.localStorage.setItem('alpaca_api_key', 'test-api-key');
      window.localStorage.setItem('alpaca_api_secret', 'test-api-secret');
  
      // Mock the stock price API
      cy.intercept('GET', 'https://data.alpaca.markets/v2/stocks/trades/latest*', {
        statusCode: 200,
        body: {
          trades: {
            AAPL: {
              p: mockStockData.price,
              s: mockStockData.symbol,
              t: new Date().toISOString(),
              i: 12345
            }
          }
        }
      }).as('getStockPrice');
  
      // Mock the options chain API
      cy.intercept('GET', 'https://paper-api.alpaca.markets/v2/options/contracts*', {
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
      // Type in the stock symbol and submit
      cy.get('input[placeholder*="Enter stock symbol"]')
        .type('AAPL')
        .should('have.value', 'AAPL');
      
      // Submit the form
      cy.get('form').first().submit();
      
      // Wait for the stock price API call
      cy.wait('@getStockPrice');
      
      // Verify the stock price is displayed - look for the price in any element
      cy.contains(new RegExp(`${mockStockData.price.toFixed(2)}`), { timeout: 10000 })
        .should('be.visible');
    });
  
    it('should allow selecting expiration date after stock is selected', () => {
      // First, search for a stock
      cy.get('input[placeholder*="Enter stock symbol"]').type('AAPL');
      cy.get('form').first().submit();
      
      // Wait for the stock data to load
      cy.wait('@getStockPrice');
      
      // The date picker should now be visible and enabled
      cy.get('input[type="date"]')
        .should('be.visible')
        .should('not.be.disabled');
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
      
      // Wait for the stock data to load
      cy.wait('@getStockPrice');
      
      // Click reset - use force:true in case the button is covered
      cy.contains('button', 'Reset').click({ force: true });
      
      // Verify the input is cleared - add a wait to ensure the reset completes
      cy.wait(500);
      cy.get('input[placeholder*="Enter stock symbol"]').should('have.value', '');
    });
  
    it('should show API key modal', () => {
      // Find and click the API button - use force:true in case it's not immediately clickable
      cy.contains('button', 'API').click({ force: true });
      
      // The modal should be visible - wait for the animation to complete
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('API Key Configuration').should('be.visible');
      
      // Close the modal - use force:true
      cy.contains('button', 'Close').click({ force: true });
      
      // The modal should be gone - wait for the animation to complete
      cy.get('[role="dialog"]').should('not.exist');
    });
  });