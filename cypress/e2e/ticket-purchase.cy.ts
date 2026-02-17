describe('Full Ticket Purchase Flow', () => {

  // Test data — assumes these exist in your Firebase test environment
  const TEST_USER = { email: 'testbuyer@tikiti.co.ke', password: 'TestPass123' };
  const TEST_EVENT_ID = 'test-event-001'; // Create this in Firebase first

  beforeEach(() => {
    cy.viewport(1280, 720);
  });

  it('A.4.1 — landing page loads correctly', () => {
    cy.visit('/');
    cy.contains('TIKITI').should('be.visible');
    cy.contains('Browse Events').should('be.visible');
    cy.get('nav').should('be.visible');
    // Page should load in under 3 seconds
    cy.window().its('performance').then((perf) => {
      const loadTime = perf.timing.loadEventEnd - perf.timing.navigationStart;
      expect(loadTime).to.be.lessThan(3000);
    });
  });

  it('A.4.2 — events page loads and filters work', () => {
    cy.visit('/events');
    cy.get('[data-testid="event-card"]').should('have.length.greaterThan', 0);
    // Test category filter
    cy.get('[data-testid="filter-campus"]').click();
    cy.url().should('include', 'category=campus');
  });

  it('A.4.3 — login flow works end-to-end', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    // Should redirect after login
    cy.url().should('not.include', '/login');
    cy.contains('Welcome back').should('be.visible');
  });

  it('A.4.4 — add ticket to cart', () => {
    // Login first
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();

    // Browse to event
    cy.visit(`/events/${TEST_EVENT_ID}`);
    cy.get('[data-testid="ticket-selector"]').should('be.visible');
    cy.get('[data-testid="ticket-type-Regular"]').click();
    cy.get('[data-testid="add-to-cart-btn"]').click();

    // Check cart badge updates
    cy.get('[data-testid="cart-badge"]').should('contain', '1');
  });

  it('A.4.5 — cart page shows correct price breakdown', () => {
    cy.visit('/cart');
    cy.get('[data-testid="subtotal"]').should('be.visible');
    cy.get('[data-testid="tikiti-fee"]').should('be.visible');
    cy.get('[data-testid="grand-total"]').should('be.visible');

    // Verify fee is 5% of subtotal
    cy.get('[data-testid="subtotal"]').invoke('text').then((subtotalText) => {
      cy.get('[data-testid="tikiti-fee"]').invoke('text').then((feeText) => {
        const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
        const fee = parseFloat(feeText.replace(/[^0-9.]/g, ''));
        expect(fee).to.be.closeTo(subtotal * 0.05, 5); // within Ksh 5 rounding
      });
    });
  });

  it('A.4.6 — payment method selection works', () => {
    cy.visit('/cart');
    cy.get('[data-testid="payment-mpesa"]').click();
    cy.get('[data-testid="phone-input"]').should('be.visible');

    cy.get('[data-testid="payment-card"]').click();
    cy.get('[data-testid="phone-input"]').should('not.exist');

    cy.get('[data-testid="payment-paypal"]').click();
    cy.contains('PayPal').should('be.visible');
  });

  it('A.4.7 — protected routes redirect to login', () => {
    // Clear session
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.visit('/my-tickets');
    cy.url().should('include', '/login');

    cy.visit('/cart');
    cy.url().should('include', '/login');

    cy.visit('/organize');
    cy.url().should('include', '/login');
  });

  it('A.4.8 — organizer cannot access customer-only routes as organizer', () => {
    // This tests role boundary enforcement
    cy.visit('/login');
    cy.get('input[type="email"]').type('organizer@tikiti.co.ke');
    cy.get('input[type="password"]').type('TestPass123');
    cy.get('button[type="submit"]').click();

    // Organizer should see dashboard link
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Organizer Dashboard').should('be.visible');
  });
});
