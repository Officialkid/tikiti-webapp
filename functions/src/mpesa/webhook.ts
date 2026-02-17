import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Safaricom calls this URL after buyer confirms/cancels payment
export const mpesaWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const body = req.body;
    const stk = body?.Body?.stkCallback;

    if (!stk) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    const checkoutRequestId: string = stk.CheckoutRequestID;
    const resultCode: number = stk.ResultCode;
    const resultDesc: string = stk.ResultDesc;

    // Find the order by CheckoutRequestID
    const ordersSnap = await db
      .collection('orders')
      .where('mpesaCheckoutRequestId', '==', checkoutRequestId)
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      console.error('Order not found for CheckoutRequestID:', checkoutRequestId);
      res.status(200).json({ ok: true }); // Always return 200 to Safaricom
      return;
    }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();

    if (resultCode === 0) {
      // ── Payment SUCCESSFUL ─────────────────────────────────────
      const callbackMetadata = stk.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = callbackMetadata.find((i: { Name: string; Value?: string }) => i.Name === 'MpesaReceiptNumber')?.Value || '';

      // 1. Update order to completed
      await orderDoc.ref.update({
        paymentStatus: 'completed',
        mpesaReceiptNumber,
        completedAt: admin.firestore.Timestamp.now(),
      });

      // 2. Update all tickets in this order to active + add receipt
      await activateTickets(orderData.ticketIds, mpesaReceiptNumber);

      // 3. Process organizer payout (5% already deducted in ticket record)
      await processOrganizerPayouts(orderData.ticketIds);

    } else {
      // ── Payment FAILED or CANCELLED ────────────────────────────
      await orderDoc.ref.update({
        paymentStatus: 'failed',
        failureReason: resultDesc,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      // Cancel the tickets
      await cancelTickets(orderData.ticketIds);
    }

    // Always return 200 to Safaricom
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa webhook error:', error);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' }); // Still return 200
  }
});

// ── Activate Tickets After Payment ──────────────────────────────────────
async function activateTickets(ticketIds: string[], receiptNumber: string) {
  const batch = admin.firestore().batch();
  for (const ticketId of ticketIds) {
    const ref = admin.firestore().doc(`tickets/${ticketId}`);
    batch.update(ref, {
      paymentStatus: 'active',
      mpesaReceiptNumber: receiptNumber,
    });
  }
  await batch.commit();
}

// ── Cancel Tickets on Failed Payment ────────────────────────────────────
async function cancelTickets(ticketIds: string[]) {
  const batch = admin.firestore().batch();
  for (const ticketId of ticketIds) {
    const ref = admin.firestore().doc(`tickets/${ticketId}`);
    batch.update(ref, { paymentStatus: 'cancelled' });
  }
  await batch.commit();
}

// ── Process Organizer Payouts (5% already deducted) ─────────────────────
// NOTE: In Phase 2 this will trigger actual M-Pesa B2C API to send money
// For now we record the payout in Firestore for accounting
async function processOrganizerPayouts(ticketIds: string[]) {
  const db = admin.firestore();

  // Group tickets by organizerId to combine payouts per organizer
  const organizerPayouts: Record<string, number> = {};

  for (const ticketId of ticketIds) {
    const ticketSnap = await db.doc(`tickets/${ticketId}`).get();
    const ticket = ticketSnap.data();
    if (!ticket) continue;

    const { organizerId, organizerPayout } = ticket;
    organizerPayouts[organizerId] = (organizerPayouts[organizerId] || 0) + organizerPayout;
  }

  // Record payout records for each organizer
  for (const [organizerId, amount] of Object.entries(organizerPayouts)) {
    const payoutRef = db.collection('payouts').doc();
    await payoutRef.set({
      payoutId: payoutRef.id,
      organizerId,
      amount,                              // Already has 5% deducted
      currency: 'KES',
      status: 'pending',                   // Phase 2: trigger B2C payout
      ticketIds,
      createdAt: admin.firestore.Timestamp.now(),
    });
  }
}
