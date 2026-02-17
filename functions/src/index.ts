/**
 * Tikiti Store — Firebase Cloud Functions
 *
 * All payment processing runs server-side.
 * API secrets are stored in Firebase Functions config, never in frontend code.
 *
 * Deployed functions:
 *   - initiateMpesaSTK      (callable)  — Send STK Push to buyer's phone
 *   - mpesaWebhook           (HTTP)      — Safaricom payment confirmation
 *   - createPayPalOrder      (callable)  — Create PayPal checkout order
 *   - capturePayPalOrder     (callable)  — Capture after buyer approves
 *   - initiateFlutterwave    (callable)  — Card/Airtel Money charge
 *   - flutterwaveWebhook     (HTTP)      — Flutterwave payment confirmation
 *   - processPayouts         (scheduled) — Daily organizer payouts
 *   - triggerPayout          (callable)  — Manual payout (admin only)
 *   - sendEmergencyBroadcast (callable)  — SMS broadcast to attendees
 */

// ── M-Pesa ──────────────────────────────────────────────────────────
export { initiateMpesaSTK } from './mpesa/stkPush';
export { mpesaWebhook } from './mpesa/webhook';

// ── PayPal ──────────────────────────────────────────────────────────
export { createPayPalOrder } from './paypal/createOrder';
export { capturePayPalOrder } from './paypal/captureOrder';

// ── Flutterwave (Card / Airtel) ─────────────────────────────────────
export { initiateFlutterwave } from './flutterwave/initiate';
export { flutterwaveWebhook } from './flutterwave/webhook';

// ── Payouts ─────────────────────────────────────────────────────────
export { processPayouts, triggerPayout } from './payouts/processPayouts';

// ── Notifications ───────────────────────────────────────────────────
export { sendEmergencyBroadcast } from './notifications/broadcast';
