// Supported currencies and their display symbols
export const CURRENCY_CONFIG: Record<string, {
  symbol: string;
  name: string;
  decimals: number;
}> = {
  KES: { symbol: 'Ksh', name: 'Kenyan Shilling', decimals: 0 },
  UGX: { symbol: 'UGX', name: 'Ugandan Shilling', decimals: 0 },
  TZS: { symbol: 'TZS', name: 'Tanzanian Shilling', decimals: 0 },
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
};

export function formatCurrency(amount: number, currency: string): string {
  const config = CURRENCY_CONFIG[currency];
  if (!config) return `${amount}`;
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  return `${config.symbol} ${formatted}`;
}

// Detect currency from browser locale / IP (basic implementation)
// In production replace with IP geolocation API call
export function detectUserCurrency(): string {
  if (typeof window === 'undefined') return 'KES';
  const lang = navigator.language || 'en-KE';
  if (lang.includes('KE') || lang.includes('ke')) return 'KES';
  if (lang.includes('UG') || lang.includes('ug')) return 'UGX';
  if (lang.includes('TZ') || lang.includes('tz')) return 'TZS';
  if (lang.includes('GB') || lang.includes('gb')) return 'GBP';
  if (lang.includes('US') || lang.includes('us')) return 'USD';
  // Default international to USD
  return 'USD';
}

// Payment methods available per currency
export function getPaymentMethodsForCurrency(currency: string): string[] {
  switch (currency) {
    case 'KES':
      return ['mpesa', 'airtel', 'card', 'paypal'];
    case 'UGX':
      return ['airtel', 'card', 'paypal'];
    case 'TZS':
      return ['airtel', 'card', 'paypal'];
    default:
      // USD, GBP, EUR — international buyers
      return ['card', 'paypal'];
  }
}
