import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const capturePayPalOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { paypalOrderId, tikititOrderId } = data;
  const mode = functions.config().paypal.mode;
  const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    // Get token (reuse helper from createOrder)
    const clientId = functions.config().paypal.client_id;
    const secret = functions.config().paypal.client_secret;
    const tokenRes = await axios.post(
      `${base}/v1/oauth2/token`,
      'grant_type=client_credentials',
      { auth: { username: clientId, password: secret }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;

    // Capture the payment
    const captureRes = await axios.post(
      `${base}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    if (captureRes.data.status === 'COMPLETED') {
      // Update order
      const orderSnap = await db.doc(`orders/${tikititOrderId}`).get();
      const orderData = orderSnap.data();

      await db.doc(`orders/${tikititOrderId}`).update({
        paymentStatus: 'completed',
        paypalOrderId,
        completedAt: admin.firestore.Timestamp.now(),
      });

      // Activate tickets
      if (orderData?.ticketIds) {
        const batch = db.batch();
        for (const id of orderData.ticketIds) {
          batch.update(db.doc(`tickets/${id}`), { paymentStatus: 'active' });
        }
        await batch.commit();

        // Process organizer payouts (5% already in ticket.organizerPayout)
        const payouts: Record<string, { amount: number; currency: string }> = {};
        for (const id of orderData.ticketIds) {
          const t = (await db.doc(`tickets/${id}`).get()).data();
          if (t) {
            if (!payouts[t.organizerId]) payouts[t.organizerId] = { amount: 0, currency: t.currency };
            payouts[t.organizerId].amount += t.organizerPayout;
          }
        }
        for (const [organizerId, payout] of Object.entries(payouts)) {
          const ref = db.collection('payouts').doc();
          await ref.set({
            payoutId: ref.id, organizerId,
            amount: payout.amount, currency: payout.currency,
            status: 'pending', ticketIds: orderData.ticketIds,
            createdAt: admin.firestore.Timestamp.now(),
          });
        }
      }

      return { success: true };
    }

    return { success: false };
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown } };
    console.error('PayPal capture error:', error.response?.data);
    throw new functions.https.HttpsError('internal', 'PayPal capture failed');
  }
});
