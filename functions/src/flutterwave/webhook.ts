import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const flutterwaveWebhook = functions.https.onRequest(async (req, res) => {
  // Verify webhook signature
  const hash = functions.config().flutterwave.webhook_hash;
  const signature = req.headers['verif-hash'];

  if (!signature || signature !== hash) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const payload = req.body;
  const { event, data } = payload;

  if (event === 'charge.completed' && data.status === 'successful') {
    // Extract Tikiti order ID from tx_ref (format: TIKITI-{orderId-prefix})
    const txRef: string = data.tx_ref || '';
    const orderPrefix = txRef.replace('TIKITI-', '');

    // Verify with Flutterwave API to prevent spoofing
    try {
      const secretKey = functions.config().flutterwave.secret_key;
      const verifyRes = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${data.id}/verify`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );

      if (verifyRes.data.data.status !== 'successful') {
        res.status(200).json({ ok: true });
        return;
      }

      // Find order
      const ordersSnap = await db
        .collection('orders')
        .where('flutterwaveTxRef', '>=', `TIKITI-${orderPrefix}`)
        .limit(1)
        .get();

      if (!ordersSnap.empty) {
        const orderDoc = ordersSnap.docs[0];
        const orderData = orderDoc.data();

        await orderDoc.ref.update({
          paymentStatus: 'completed',
          flutterwaveTransactionId: data.id.toString(),
          completedAt: admin.firestore.Timestamp.now(),
        });

        await activateTickets(orderData.ticketIds);
        await processOrganizerPayouts(orderData.ticketIds);
      }
    } catch (err) {
      console.error('Flutterwave verify error:', err);
    }
  }

  res.status(200).json({ status: 'received' });
});

// Reuse same helpers as M-Pesa webhook
async function activateTickets(ticketIds: string[]) {
  const batch = db.batch();
  for (const id of ticketIds) batch.update(db.doc(`tickets/${id}`), { paymentStatus: 'active' });
  await batch.commit();
}

async function processOrganizerPayouts(ticketIds: string[]) {
  const payouts: Record<string, number> = {};
  for (const id of ticketIds) {
    const snap = await db.doc(`tickets/${id}`).get();
    const t = snap.data();
    if (t) payouts[t.organizerId] = (payouts[t.organizerId] || 0) + t.organizerPayout;
  }
  for (const [organizerId, amount] of Object.entries(payouts)) {
    const ref = db.collection('payouts').doc();
    await ref.set({
      payoutId: ref.id, organizerId, amount,
      currency: 'KES', status: 'pending', ticketIds,
      createdAt: admin.firestore.Timestamp.now(),
    });
  }
}
