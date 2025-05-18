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
      // Log all network requests
      cy.intercept('*', (req) => {
        console.log('Request:', req.method, req.url);
        req.continue();
      });

      // Type in the stock symbol
      cy.get('input[placeholder*="Enter stock symbol"]')
        .type('AAPL')
        .should('have.value', 'AAPL');
      
      // Click the "Go" button to submit the form
      cy.get('form').first().within(() => {
        cy.get('button[type="submit"]').click();
      });
      
      // Wait for the stock price API call and log the response
      cy.wait('@getStockPrice').then((interception) => {
        console.log('Stock price API response:', interception.response?.body);
      });

      // Add a small delay to ensure the UI updates
      cy.wait(1000);
      
      // Debug: Log the entire body to see what's rendered
      cy.document().then((doc) => {
        console.log('Document body:', doc.body.innerText);
      });
      
      // Check if the stock data is loaded by looking for the stock symbol
      cy.contains('AAPL', { timeout: 10000 }).should('be.visible');
      
      // Now look for the price
      cy.get('div').contains('Current Price', { timeout: 10000 })
        .should('be.visible')
        .parent()
        .find('span')
        .should('contain', '175.34');
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
      
      // The modal should be visible - check for the modal content
      cy.contains('Alpaca API Settings').should('be.visible');
      
      // Close the modal - use the close button
      cy.get('button').contains('Cancel').click({ force: true });
      
      // The modal should be gone
      cy.contains('Alpaca API Settings').should('not.exist');
    });
  });