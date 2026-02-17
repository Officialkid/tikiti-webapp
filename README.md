This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Firebase Functions Configuration

### Emergency Broadcast System (Africa's Talking SMS)

The emergency broadcast feature uses Africa's Talking API to send SMS alerts to event attendees. Configure before deploying:

```bash
# Set Africa's Talking credentials
firebase functions:config:set africastalking.username="YOUR_AT_USERNAME"
firebase functions:config:set africastalking.api_key="YOUR_AT_API_KEY"

# Verify configuration
firebase functions:config:get

# Deploy functions
firebase deploy --only functions
```

**Get Africa's Talking credentials:**
1. Sign up at https://africastalking.com
2. Create an app (use "Sandbox" for testing, "Production" for live)
3. Get your **username** (usually "sandbox" for testing) from the dashboard
4. Generate an **API key** from Settings → API

**Note:** The sender ID "TIKITI" must be approved by Africa's Talking for production use. In sandbox mode, test messages are sent with default sender ID.

### PayPal Configuration

```bash
firebase functions:config:set paypal.mode="sandbox"  # or "live"
firebase functions:config:set paypal.client_id="YOUR_CLIENT_ID"
firebase functions:config:set paypal.client_secret="YOUR_CLIENT_SECRET"
```

### Flutterwave Configuration

```bash
firebase functions:config:set flutterwave.secret_key="YOUR_SECRET_KEY"
firebase functions:config:set flutterwave.webhook_hash="YOUR_WEBHOOK_HASH"
```

### M-Pesa Configuration

```bash
firebase functions:config:set mpesa.consumer_key="YOUR_CONSUMER_KEY"
firebase functions:config:set mpesa.consumer_secret="YOUR_CONSUMER_SECRET"
firebase functions:config:set mpesa.business_shortcode="YOUR_SHORTCODE"
firebase functions:config:set mpesa.passkey="YOUR_PASSKEY"
```
