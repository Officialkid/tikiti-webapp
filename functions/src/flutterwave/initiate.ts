/**
 * Flutterwave — Initiate charge for Card / Airtel Money.
 *
 * Flow:
 *   1. Frontend calls this function with orderId + payment details
 *   2. We create a Flutterwave charge via their REST API
 *   3. For cards: return a redirect URL → buyer completes 3DS
 *   4. For Airtel: buyer receives a USSD prompt on their phone
 *   5. Flutterwave sends confirmation to flutterwaveWebhook
 *
 * Environment variables:
 *   flutterwave.secret_key
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const FLW_BASE = 'https://api.flutterwave.com/v3';

export const initiateFlutterwave = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to make a payment'
    );
  }

  const { orderId, paymentMethod, phoneNumber } = request.data as {
    orderId: string;
    paymentMethod: 'card' | 'airtel';
    phoneNumber?: string;
  };

  if (!orderId || !paymentMethod) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'orderId and paymentMethod are required'
    );
  }

  if (paymentMethod === 'airtel' && !phoneNumber) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Phone number is required for Airtel Money payments'
    );
  }

  // Verify order
  const orderSnap = await db.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Order not found');
  }
  const orderData = orderSnap.data()!;
  if (orderData.userId !== request.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Order does not belong to this user'
    );
  }

  try {
    const secretKey = functions.config().flutterwave.secret_key;
    const txRef = `TIKITI-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // Fetch user email for receipt
    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    const userEmail = userSnap.data()?.email || request.auth.token?.email || '';

    const basePayload = {
      tx_ref: txRef,
      amount: orderData.grandTotal,
      currency: orderData.currency || 'KES',
      redirect_url: `${functions.config().app?.url || 'https://tikiti.store'}/order-confirmed?orderId=${orderId}`,
      customer: {
        email: userEmail,
      },
      meta: {
        orderId,
        userId: request.auth.uid,
      },
      customizations: {
        title: 'Tikiti Store',
        description: `${orderData.ticketCount || 1} ticket(s)`,
        logo: 'https://tikiti.store/assets/logo.png',
      },
    };

    let endpoint: string;
    let payload: Record<string, unknown>;

    if (paymentMethod === 'card') {
      // Standard Flutterwave payment link (handles card + 3DS)
      endpoint = `${FLW_BASE}/payments`;
      payload = basePayload;
    } else {
      // Airtel Money — mobile money charge
      endpoint = `${FLW_BASE}/charges?type=mobile_money_uganda`;
      // For KES use mpesa endpoint, for UGX/TZS use mobile money
      payload = {
        ...basePayload,
        phone_number: phoneNumber,
        network: 'AIRTEL',
      };
    }

    const { data } = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Store Flutterwave reference for webhook matching
    await db.collection('orders').doc(orderId).update({
      'flutterwave.txRef': txRef,
      'flutterwave.flwRef': data.data?.flw_ref || null,
      paymentStatus: 'pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      redirectUrl: data.data?.link || data.data?.redirect_url || null,
      txRef,
      message:
        paymentMethod === 'card'
          ? 'Redirecting to payment page…'
          : 'Check your phone for the Airtel Money prompt',
    };
  } catch (error) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error(
      'Flutterwave initiate error:',
      err.response?.data || err.message
    );
    throw new functions.https.HttpsError(
      'internal',
      'Failed to initiate payment. Please try again.'
    );
  }
});
