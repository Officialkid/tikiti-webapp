/**
 * Payouts — Auto-deduct 5% Tikiti fee, send organizer payout.
 *
 * This function runs on a schedule (or can be triggered manually)
 * to process payouts for completed orders.
 *
 * Money flow:
 *   Buyer → Payment Provider → Tikiti account → Organizer payout (minus 5%)
 *
 * Each ticket document already has:
 *   price: 1000              // What buyer paid
 *   tikitiFee: 50            // 5% for Tikiti
 *   organizerPayout: 950     // What organizer receives
 *
 * This function reads organizerPayout and initiates the transfer.
 * Sprint 4 implementation — actual transfer depends on payment provider.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled function: Process pending organizer payouts.
 * Runs daily at 6 AM EAT (3 AM UTC).
 */
export const processPayouts = functions.pubsub
  .schedule('0 3 * * *')
  .timeZone('Africa/Nairobi')
  .onRun(async () => {
    try {
      // Find all completed orders that haven't been paid out
      const ordersSnap = await db
        .collection('orders')
        .where('paymentStatus', '==', 'completed')
        .where('payoutStatus', '==', null)
        .limit(100)
        .get();

      if (ordersSnap.empty) {
        console.log('No pending payouts to process.');
        return;
      }

      console.log(`Processing ${ordersSnap.size} pending payouts…`);

      for (const orderDoc of ordersSnap.docs) {
        const order = orderDoc.data();
        const ticketIds: string[] = order.ticketIds || [];

        // Aggregate organizer payouts by organizerId
        const payoutsByOrganizer: Record<
          string,
          { total: number; currency: string; ticketCount: number }
        > = {};

        for (const ticketId of ticketIds) {
          const ticketSnap = await db.collection('tickets').doc(ticketId).get();
          if (!ticketSnap.exists) continue;
          const ticket = ticketSnap.data()!;

          const orgId = ticket.organizerId;
          if (!payoutsByOrganizer[orgId]) {
            payoutsByOrganizer[orgId] = {
              total: 0,
              currency: ticket.currency,
              ticketCount: 0,
            };
          }
          payoutsByOrganizer[orgId].total += ticket.organizerPayout;
          payoutsByOrganizer[orgId].ticketCount += 1;
        }

        // Create payout records
        for (const [organizerId, payout] of Object.entries(payoutsByOrganizer)) {
          const payoutId = db.collection('payouts').doc().id;

          await db.collection('payouts').doc(payoutId).set({
            payoutId,
            organizerId,
            orderId: orderDoc.id,
            amount: payout.total,
            currency: payout.currency,
            ticketCount: payout.ticketCount,
            status: 'pending',
            // Sprint 4: Add actual transfer logic here
            // - M-Pesa B2C for KES payouts
            // - PayPal Payouts API for USD
            // - Flutterwave Transfer for other currencies
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(
            `📤 Payout created: ${payout.total} ${payout.currency} → organizer ${organizerId}`
          );
        }

        // Mark order as payout-processed
        await orderDoc.ref.update({
          payoutStatus: 'processed',
          payoutProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log('✅ Payout processing complete.');
    } catch (error) {
      console.error('Payout processing error:', error);
    }
  });

/**
 * Manual trigger: Process payout for a specific order (admin use).
 */
export const triggerPayout = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Verify admin role
  const userSnap = await db.collection('users').doc(request.auth.uid).get();
  if (userSnap.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can trigger manual payouts'
    );
  }

  const { orderId } = request.data as { orderId: string };

  if (!orderId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'orderId is required'
    );
  }

  const orderSnap = await db.collection('orders').doc(orderId).get();
  if (!orderSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Order not found');
  }

  const order = orderSnap.data()!;
  if (order.paymentStatus !== 'completed') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Order payment status is "${order.paymentStatus}", not "completed"`
    );
  }

  // TODO Sprint 4: Initiate actual transfer via payment provider
  // For now, just create the payout record

  return {
    success: true,
    message: `Payout record created for order ${orderId}`,
  };
});
