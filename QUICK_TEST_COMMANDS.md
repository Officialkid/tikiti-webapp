# 🚀 Quick Test Commands

## Run Tests

```bash
# Unit Tests
npm test                    # Run all unit tests once
npm run test:watch          # Watch mode (auto-rerun on changes)
npm run test:coverage       # Generate coverage report

# E2E Tests  
npm run test:e2e            # Open Cypress interactive GUI
npm run test:e2e:headless   # Run Cypress headless (CI mode)

# Specific Tests
npm test EventCard          # Run tests matching "EventCard"
npm test -- --watch         # Run specific pattern in watch mode
```

## View Results

```bash
# Coverage Report
open coverage/lcov-report/index.html   # Mac/Linux
start coverage/lcov-report/index.html  # Windows

# Cypress Results
# Videos: cypress/videos/
# Screenshots: cypress/screenshots/
```

## Debug Tests

```bash
# Jest Debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Cypress Debug
# Use cy.debug() or cy.pause() in test files
```

## CI/CD

Tests run automatically on:
- Push to main/develop branches
- Pull requests to main/develop

See: .github/workflows/test.yml

---

**Coverage Thresholds:**
- Branches: 70%
- Functions: 80%
- Lines: 80%
- Statements: 80%

**Documentation:** See TESTING.md for complete guide
