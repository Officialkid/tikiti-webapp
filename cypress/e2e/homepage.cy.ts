/**
 * E2E Test: Homepage Navigation
 * 
 * Tests the main landing page and navigation flows
 */

describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the homepage successfully', () => {
    cy.contains('Tikiti').should('be.visible');
    cy.get('nav').should('exist');
    cy.get('footer').should('exist');
  });

  it('should display featured events section', () => {
    cy.contains('Featured Events').should('be.visible');
    // Wait for events to load
    cy.get('[data-testid="event-card"]', { timeout: 10000 })
      .should('have.length.greaterThan', 0);
  });

  it('should navigate to events page', () => {
    cy.contains('Browse Events').click();
    cy.url().should('include', '/events');
    cy.contains('All Events').should('be.visible');
  });

  it('should open login page from navbar', () => {
    cy.get('nav').contains('Login').click();
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').should('be.visible');
  });

  it('should be accessible', () => {
    // Check for basic accessibility
    cy.get('main').should('have.attr', 'role', 'main');
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });
});
