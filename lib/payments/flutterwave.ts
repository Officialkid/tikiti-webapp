// Load Flutterwave inline script
export function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('flutterwave-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'flutterwave-script';
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave'));
    document.body.appendChild(script);
  });
}

interface FlutterwavePaymentParams {
  publicKey: string;        // from env NEXT_PUBLIC_FLW_PUBLIC_KEY
  orderId: string;
  amount: number;
  currency: string;
  email: string;
  phoneNumber?: string;
  paymentMethod: 'card' | 'mobile_money_kenya' | 'mobile_money_uganda' | 'mobile_money_tanzania';
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

interface FlutterwaveResponse {
  status: string;
  transaction_id: string | number;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: unknown) => void;
  }
}

export async function initiateFlutterwavePayment(params: FlutterwavePaymentParams) {
  await loadFlutterwaveScript();

  const FlutterwaveCheckout = window.FlutterwaveCheckout;
  if (!FlutterwaveCheckout) throw new Error('Flutterwave not loaded');

  FlutterwaveCheckout({
    public_key: params.publicKey,
    tx_ref: `TIKITI-${params.orderId}`,
    amount: params.amount,
    currency: params.currency,
    payment_options: params.paymentMethod,
    customer: {
      email: params.email,
      phonenumber: params.phoneNumber || '',
      name: 'Tikiti Customer',
    },
    meta: { orderId: params.orderId },
    customizations: {
      title: 'Tikiti',
      description: 'Event Ticket Purchase',
      logo: 'https://yourdomain.com/logo.png',
    },
    callback: (response: FlutterwaveResponse) => {
      if (response.status === 'successful' || response.status === 'completed') {
        params.onSuccess(response.transaction_id.toString());
      } else {
        params.onCancel();
      }
    },
    onclose: params.onCancel,
  });
}
