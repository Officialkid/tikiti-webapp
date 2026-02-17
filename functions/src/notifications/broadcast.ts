import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const BROADCAST_TEMPLATES = {
  evacuation: (eventTitle: string) =>
    `🚨 TIKITI ALERT: ${eventTitle} — PLEASE EVACUATE the venue immediately via nearest exit. Stay calm.`,
  medical: (eventTitle: string) =>
    `🚑 TIKITI ALERT: ${eventTitle} — Medical emergency on site. Please stay clear of central area. Help is on the way.`,
  postponed: (eventTitle: string, newDate: string) =>
    `📅 TIKITI ALERT: ${eventTitle} has been postponed to ${newDate}. Your tickets remain valid. Refund info at tikiti.co.ke`,
  cancelled: (eventTitle: string) =>
    `❌ TIKITI ALERT: ${eventTitle} has been cancelled. Full refund will be processed within 24 hours.`,
  allclear: (eventTitle: string) =>
    `✅ TIKITI: ${eventTitle} — All clear. Resume normal activity. Thank you for your patience.`,
  custom: (_: string, message: string) => `📢 TIKITI (${_}): ${message}`,
};

export const sendEmergencyBroadcast = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { eventId, broadcastType, customMessage, newDate } = data;

  // Verify caller is the event organizer
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists) throw new functions.https.HttpsError('not-found', 'Event not found');

  const event = eventSnap.data()!;
  if (event.organizerId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Only the organizer can broadcast');
  }

  // Get all phone numbers of ticket holders
  const ticketsSnap = await db
    .collection('tickets')
    .where('eventId', '==', eventId)
    .where('paymentStatus', '==', 'active')
    .get();

  if (ticketsSnap.empty) {
    return { success: true, sent: 0, message: 'No active ticket holders found' };
  }

  // Collect unique user IDs
  const userIds = [...new Set(ticketsSnap.docs.map((d) => d.data().userId))];

  // Fetch phone numbers for all attendees
  const phoneNumbers: string[] = [];
  for (const userId of userIds) {
    const userSnap = await db.doc(`users/${userId}`).get();
    const phone = userSnap.data()?.phone;
    if (phone) {
      // Normalize: 0712345678 → +254712345678
      const normalized = phone.replace(/^0/, '+254');
      phoneNumbers.push(normalized);
    }
  }

  if (phoneNumbers.length === 0) {
    return { success: false, message: 'No phone numbers found' };
  }

  // Build message
  const templateFn = BROADCAST_TEMPLATES[broadcastType as keyof typeof BROADCAST_TEMPLATES]
    || BROADCAST_TEMPLATES.custom;
  const message = broadcastType === 'custom'
    ? templateFn(event.title, customMessage)
    : broadcastType === 'postponed'
    ? BROADCAST_TEMPLATES.postponed(event.title, newDate || 'TBD')
    : (templateFn as (t: string) => string)(event.title);

  // Send SMS via Africa's Talking
  const atUsername = functions.config().africastalking.username;
  const atApiKey = functions.config().africastalking.api_key;

  try {
    const response = await axios.post(
      'https://api.africastalking.com/version1/messaging',
      new URLSearchParams({
        username: atUsername,
        to: phoneNumbers.join(','),
        message,
        from: 'TIKITI',
      }),
      {
        headers: {
          apiKey: atApiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Log broadcast
    await db.collection('broadcasts').add({
      eventId,
      organizerId: context.auth.uid,
      type: broadcastType,
      message,
      recipientCount: phoneNumbers.length,
      atResponse: response.data,
      sentAt: admin.firestore.Timestamp.now(),
    });

    return {
      success: true,
      sent: phoneNumbers.length,
      message: `Alert sent to ${phoneNumbers.length} attendees`,
    };
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string };
    console.error('Broadcast error:', error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Failed to send broadcast');
  }
});
