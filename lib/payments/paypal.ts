// Dynamically load PayPal JS SDK
export function loadPayPalScript(clientId: string, currency: string = 'USD'): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('paypal-sdk');
    if (existing) { resolve(); return; }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PayPal SDK failed to load'));
    document.body.appendChild(script);
  });
}
