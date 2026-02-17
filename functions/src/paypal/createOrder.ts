import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) admin.initializeApp();

async function getPayPalToken(): Promise<string> {
  const clientId = functions.config().paypal.client_id;
  const secret = functions.config().paypal.client_secret;
  const mode = functions.config().paypal.mode; // 'sandbox' or 'live'
  const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const res = await axios.post(
    `${base}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      auth: { username: clientId, password: secret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
  return res.data.access_token;
}

export const createPayPalOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { orderId, amount, currency } = data;
  const mode = functions.config().paypal.mode;
  const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    const token = await getPayPalToken();
    const res = await axios.post(
      `${base}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: 'Tikiti Event Ticket',
        }],
        application_context: {
          brand_name: 'Tikiti',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    return { paypalOrderId: res.data.id };
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown } };
    console.error('PayPal createOrder error:', error.response?.data);
    throw new functions.https.HttpsError('internal', 'PayPal order creation failed');
  }
});
