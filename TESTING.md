# Testing Setup - Tikiti Store

## Overview

This project uses **Jest** for unit testing and **Cypress** for end-to-end testing, with integrated accessibility testing via **jest-axe** and **@axe-core/react**.

## 📦 Installed Packages

### Core Testing
- `jest` - JavaScript testing framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM
- `jest-environment-jsdom` - Browser-like environment for tests
- `@types/jest` - TypeScript types for Jest

### End-to-End Testing
- `cypress` - E2E testing framework with browser automation

### Accessibility Testing
- `jest-axe` - Accessibility testing in unit tests
- `@axe-core/react` - Real-time accessibility testing

### API Mocking
- `msw` (Mock Service Worker) - API mocking for tests

## 🚀 Running Tests

### Unit Tests (Jest)
```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests (Cypress)
```bash
# Open Cypress Test Runner (interactive mode)
npm run test:e2e

# Run Cypress tests headlessly (CI mode)
npm run test:e2e:headless
```

## 📁 Test File Structure

```
tikiti-webapp/
├── __tests__/              # Jest unit tests
│   ├── components/         # Component tests
│   │   ├── EventCard.test.tsx
│   │   └── CapacityBar.test.tsx
│   └── lib/                # Utility tests
│       └── currency.test.ts
├── cypress/
│   ├── e2e/                # E2E test specs
│   │   ├── homepage.cy.ts
│   │   └── purchase-flow.cy.ts
│   ├── support/            # Cypress commands & config
│   │   ├── commands.ts
│   │   └── e2e.ts
│   ├── videos/             # Test run recordings
│   └── screenshots/        # Failure screenshots
├── jest.config.ts          # Jest configuration
├── jest.setup.ts           # Jest global setup
└── cypress.config.ts       # Cypress configuration
```

## ✍️ Writing Tests

### Unit Test Example (Jest)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### E2E Test Example (Cypress)

```typescript
describe('Feature Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete user journey', () => {
    cy.contains('Browse Events').click();
    cy.url().should('include', '/events');
    
    cy.get('[data-testid="event-card"]').first().click();
    cy.contains('Add to Cart').click();
    cy.contains('Added to cart').should('be.visible');
  });
});
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🎯 Coverage Thresholds

The project enforces minimum code coverage:

| Metric      | Threshold |
|-------------|-----------|
| Branches    | 70%       |
| Functions   | 80%       |
| Lines       | 80%       |
| Statements  | 80%       |

Coverage reports are generated in `/coverage` directory when running `npm run test:coverage`.

## 🔧 Configuration Files

### jest.config.ts
- Test environment: jsdom (browser simulation)
- Module path mapping for `@/` imports
- CSS module mocking
- Coverage collection settings

### jest.setup.ts
- Global test setup
- Next.js router mocks
- Firebase mocks
- Custom matchers (jest-axe)

### cypress.config.ts
- Base URL: http://localhost:3000
- Video recording enabled
- Screenshot on failure
- Custom timeouts and viewport settings

## 🧪 Custom Cypress Commands

### Login Command
```typescript
cy.login('user@example.com', 'password123');
```

### Add to Cart Command
```typescript
cy.addToCart('event-id-123');
```

## 📊 Viewing Test Results

### Jest Coverage Report
After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

### Cypress Videos
Test run videos are saved to:
```
cypress/videos/
```

### Cypress Screenshots (failures only)
```
cypress/screenshots/
```

## 🐛 Debugging Tests

### Jest Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Cypress Debug
Use `cy.debug()` or `cy.pause()` in your tests:
```typescript
cy.get('.my-element').debug();
cy.pause(); // Pauses test execution
```

## 🚫 Common Issues

### "Cannot find module '@/...'"
- Ensure `jest.config.ts` has correct `moduleNameMapper`
- Check `tsconfig.json` paths configuration

### Cypress "baseUrl" connection refused
- Make sure dev server is running: `npm run dev`
- Verify port 3000 is not blocked

### Firebase warnings in tests
- Mocks are configured in `jest.setup.ts`
- For integration tests, use MSW to mock API calls

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [jest-axe Guide](https://github.com/nickcolley/jest-axe)
- [MSW Documentation](https://mswjs.io/)

## ✅ Pre-Commit Checklist

Before pushing code:
1. ✅ Run `npm test` - all tests pass
2. ✅ Run `npm run test:coverage` - meets thresholds
3. ✅ Run `npm run lint` - no lint errors
4. ✅ Run E2E tests for critical flows

---

**Happy Testing! 🎉**
