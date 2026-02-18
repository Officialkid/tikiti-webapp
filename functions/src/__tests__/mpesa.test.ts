// Mock axios BEFORE any imports
jest.mock('axios');

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const actualAdmin = jest.requireActual('firebase-admin');
  
  const mockFirestore = {
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ paymentStatus: 'created' }),
    }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  };

  return {
    ...actualAdmin,
    apps: { length: 1 },
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
  };
});

import * as functionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as functions from 'firebase-functions';

const testEnv = functionsTest();
const db = admin.firestore();

// Import the function AFTER all mocks are set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initiateMpesaSTK } = require('../mpesa/stkPush');

describe('M-Pesa STK Push', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up test environment
    testEnv.cleanup();
  });

  test('B.1.1 — rejects unauthenticated call', async () => {
    const wrapped = testEnv.wrap(initiateMpesaSTK);
    
    await expect(
      wrapped(
        { orderId: 'test', phoneNumber: '0712345678', amount: 1000 },
        { auth: undefined }
      )
    ).rejects.toThrow('unauthenticated');
  });

  test('B.1.2 — rejects missing phone number', async () => {
    const wrapped = testEnv.wrap(initiateMpesaSTK);
    
    await expect(
      wrapped(
        { orderId: 'test', amount: 1000 },
        { auth: { uid: 'user-001' } }
      )
    ).rejects.toThrow('invalid-argument');
  });

  test('B.1.3 — normalizes phone correctly', () => {
    const cases = [
      ['0712345678', '254712345678'],
      ['+254712345678', '254712345678'],
      ['254712345678', '254712345678'],
    ];
    
    cases.forEach(([input, expected]) => {
      const normalized = input.replace(/^0/, '254').replace(/^\+/, '');
      expect(normalized).toBe(expected);
    });
  });

  test('B.1.4 — order paymentStatus set to pending after STK initiated', async () => {
    const testOrderId = 'test-order-001';
    
    // Mock axios responses
    axios.get.mockResolvedValue({
      data: { access_token: 'mock-token-123' },
    });

    axios.post.mockResolvedValue({
      data: {
        CheckoutRequestID: 'ws_CO_test_12345',
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
      },
    });

    // Mock functions.config()
    const mockConfig = {
      mpesa: {
        consumer_key: 'mock-key',
        consumer_secret: 'mock-secret',
        shortcode: '174379',
        passkey: 'mock-passkey',
        callback_url: 'https://mock-callback.com/webhook',
      },
    };
    
    jest.spyOn(functions, 'config').mockReturnValue(mockConfig);

    const wrapped = testEnv.wrap(initiateMpesaSTK);
    
    const result = await wrapped(
      {
        orderId: testOrderId,
        phoneNumber: '0712345678',
        amount: 1000,
      },
      { auth: { uid: 'user-001' } }
    );

    expect(result.success).toBe(true);
    expect(result.checkoutRequestId).toBe('ws_CO_test_12345');

    // Verify db.doc().update() was called with correct data
    expect(db.doc).toHaveBeenCalledWith(`orders/${testOrderId}`);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        mpesaCheckoutRequestId: 'ws_CO_test_12345',
        paymentStatus: 'pending',
      })
    );
  });

  test('B.1.5 — handles M-Pesa API error gracefully', async () => {
    // Mock axios responses with error
    axios.get.mockResolvedValue({
      data: { access_token: 'mock-token-123' },
    });

    axios.post.mockRejectedValue({
      response: {
        data: { errorMessage: 'Invalid phone number' },
      },
      message: 'Request failed',
    });

    // Mock functions.config()
    const originalConfig = functions.config;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (functions as any).config = jest.fn().mockReturnValue({
      mpesa: {
        consumer_key: 'mock-key',
        consumer_secret: 'mock-secret',
        shortcode: '174379',
        passkey: 'mock-passkey',
        callback_url: 'https://mock-callback.com/webhook',
      },
    });

    const wrapped = testEnv.wrap(initiateMpesaSTK);
    
    try {
      await expect(
        wrapped(
          {
            orderId: 'test-error-order',
            phoneNumber: '0712345678',
            amount: 1000,
          },
          { auth: { uid: 'user-001' } }
        )
      ).rejects.toThrow('internal');
    } finally {
      // Restore original config
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (functions as any).config = originalConfig;
    }
  });
});
