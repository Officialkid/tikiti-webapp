/**
 * MSW (Mock Service Worker) Setup
 * 
 * This file sets up API mocking for tests using MSW.
 * Uncomment and configure handlers as needed.
 */

// import { setupServer } from 'msw/node';
// import { rest } from 'msw';

// Define API mocks
// export const handlers = [
//   // Mock Firebase Functions
//   rest.post('https://us-central1-tikiti-store.cloudfunctions.net/createPayPalOrder', (req, res, ctx) => {
//     return res(
//       ctx.json({
//         success: true,
//         paypalOrderId: 'mock-paypal-order-123',
//       })
//     );
//   }),
//
//   // Mock event data
//   rest.get('/api/events/:eventId', (req, res, ctx) => {
//     return res(
//       ctx.json({
//         eventId: req.params.eventId,
//         title: 'Mock Event',
//         price: 1000,
//       })
//     );
//   }),
// ];

// Setup MSW server
// export const server = setupServer(...handlers);

// Start server before all tests
// beforeAll(() => server.listen());

// Reset handlers after each test
// afterEach(() => server.resetHandlers());

// Clean up after all tests
// afterAll(() => server.close());

export {};
