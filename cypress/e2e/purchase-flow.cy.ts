/**
 * E2E Test: Event Purchase Flow
 * 
 * Tests the complete ticket purchase journey
 */

describe('Event Purchase Flow', () => {
  const testEvent = {
    id: 'test-event-001',
    title: 'Test Concert 2026',
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete full purchase flow', () => {
    // 1. Browse to event details
    cy.visit('/events');
    cy.get('[data-testid="event-card"]').first().click();
    
    // 2. View event details
    cy.url().should('include', '/events/');
    cy.contains('Ticket Type').should('be.visible');
    
    // 3. Select ticket and add to cart
    cy.contains('Select Ticket').click();
    cy.get('button').contains('Add to Cart').click();
    cy.contains('Added to cart').should('be.visible');
    
    // 4. Go to cart
    cy.get('[aria-label="Cart"]').click();
    cy.url().should('include', '/cart');
    cy.contains('Shopping Cart').should('be.visible');
    
    // 5. Verify cart contents
    cy.get('[data-testid="cart-item"]').should('have.length.greaterThan', 0);
    cy.contains('Checkout').should('be.visible');
  });

  it('should handle ticket quantity changes', () => {
    cy.visit('/cart');
    
    // Increase quantity
    cy.get('[aria-label="Increase quantity"]').first().click();
    cy.contains('2').should('be.visible');
    
    // Decrease quantity
    cy.get('[aria-label="Decrease quantity"]').first().click();
    cy.contains('1').should('be.visible');
  });

  it('should remove item from cart', () => {
    cy.visit('/cart');
    
    cy.get('[data-testid="cart-item"]').should('have.length.greaterThan', 0);
    cy.get('[aria-label="Remove item"]').first().click();
    
    // Cart should update
    cy.wait(1000);
  });

  it('should validate login requirement at checkout', () => {
    cy.visit('/cart');
    
    // Try to checkout without login
    cy.contains('Checkout').click();
    
    // Should redirect to login
    cy.url().should('include', '/login');
    cy.contains('Please log in to continue').should('be.visible');
  });
});
