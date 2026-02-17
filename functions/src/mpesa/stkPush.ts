import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ── Get OAuth Token from Safaricom ────────────────────────────────────
async function getMpesaToken(): Promise<string> {
  const consumerKey = functions.config().mpesa.consumer_key;
  const consumerSecret = functions.config().mpesa.consumer_secret;
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    // PRODUCTION: change 'sandbox' to 'api'
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  return response.data.access_token;
}

// ── Initiate STK Push ─────────────────────────────────────────────────
export const initiateMpesaSTK = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { orderId, phoneNumber, amount } = data;

  // Validate inputs
  if (!orderId || !phoneNumber || !amount) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Normalize phone: 0712345678 → 254712345678
  const normalizedPhone = phoneNumber.replace(/^0/, '254').replace(/^\+/, '');

  try {
    const token = await getMpesaToken();
    const shortcode = functions.config().mpesa.shortcode;
    const passkey = functions.config().mpesa.passkey;
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const callbackUrl = functions.config().mpesa.callback_url;

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),        // M-Pesa requires integer
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `TIKITI-${orderId.slice(0, 8).toUpperCase()}`,
        TransactionDesc: 'Tikiti Event Ticket',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { CheckoutRequestID, ResponseCode, ResponseDescription } = response.data;

    if (ResponseCode !== '0') {
      throw new Error(`M-Pesa error: ${ResponseDescription}`);
    }

    // Save CheckoutRequestID to order — webhook uses this to match
    await db.doc(`orders/${orderId}`).update({
      mpesaCheckoutRequestId: CheckoutRequestID,
      paymentStatus: 'pending',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { success: true, checkoutRequestId: CheckoutRequestID };
  } catch (error) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error('STK Push error:', err.response?.data || err.message);
    throw new functions.https.HttpsError('internal', 'M-Pesa payment initiation failed');
  }
});
