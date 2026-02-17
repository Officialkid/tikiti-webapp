const DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1440, height: 900 },
];

const PAGES = ['/', '/events', '/login', '/register', '/cart', '/my-tickets'];

DEVICES.forEach((device) => {
  describe(`Responsive — ${device.name} (${device.width}×${device.height})`, () => {
    beforeEach(() => cy.viewport(device.width, device.height));

    PAGES.forEach((page) => {
      it(`A.5 — ${page} has no horizontal scroll on ${device.name}`, () => {
        cy.visit(page);
        // No horizontal scroll = scrollWidth equals clientWidth
        cy.window().then((win) => {
          expect(win.document.documentElement.scrollWidth)
            .to.be.lte(win.document.documentElement.clientWidth + 5);
        });
      });
    });

    it(`A.5 — Navbar hamburger visible on ${device.name}`, () => {
      if (device.width < 768) {
        cy.visit('/');
        cy.get('[data-testid="hamburger-menu"]').should('be.visible');
      }
    });

    it(`A.5 — Cart page readable on ${device.name}`, () => {
      cy.visit('/cart');
      // All text should be readable (no overflow hidden cutting text)
      cy.get('h1').should('be.visible');
    });
  });
});
