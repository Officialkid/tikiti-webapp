'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadPayPalScript } from '@/lib/payments/paypal';

interface Props {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function PayPalButton({ orderId, amount, currency, onSuccess, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

  const stableOnSuccess = useCallback(() => onSuccess(), [onSuccess]);
  const stableOnError = useCallback((msg: string) => onError(msg), [onError]);

  useEffect(() => {
    let rendered = false;

    const init = async () => {
      try {
        await loadPayPalScript(clientId, currency);
        const paypal = (window as unknown as Record<string, unknown>).paypal as Record<string, (...args: unknown[]) => { render: (el: HTMLElement) => void }> | undefined;
        if (!paypal || !containerRef.current || rendered) return;
        rendered = true;
        setLoading(false);

        paypal.Buttons({
          style: { layout: 'vertical', color: 'blue', shape: 'pill', label: 'pay' },

          // Step 1: Create PayPal order via API route
          createOrder: async () => {
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId, amount, currency }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create order');
            return data.paypalOrderId;
          },

          // Step 2: Capture payment after buyer approves
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paypalOrderId: data.orderID,
                tikititOrderId: orderId,
              }),
            });
            const result = await res.json();
            if (result.success) {
              stableOnSuccess();
            } else {
              stableOnError('Payment capture failed');
            }
          },

          onError: (err: Error) => {
            console.error('PayPal error:', err);
            stableOnError('PayPal payment failed');
          },

          onCancel: () => stableOnError('Payment cancelled'),
        }).render(containerRef.current);
      } catch {
        stableOnError('PayPal failed to load');
      }
    };

    init();
  }, [orderId, amount, currency, clientId, stableOnSuccess, stableOnError]);

  return (
    <div>
      {loading && (
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      )}
      <div ref={containerRef} />
    </div>
  );
}
