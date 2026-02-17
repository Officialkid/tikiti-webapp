export type PaymentMethod = 'mpesa' | 'airtel' | 'card' | 'paypal';

export type TicketStatus = 'pending' | 'active' | 'used' | 'refunded' | 'cancelled';

export type SupportedCurrency = 'KES' | 'USD' | 'GBP' | 'EUR' | 'UGX' | 'TZS';

export interface CartItem {
  cartItemId: string;
  eventId: string;
  eventTitle: string;
  eventImageUrl: string;
  eventDate: Date;
  eventVenue: string;
  eventCity: string;
  organizerId: string;
  ticketType: string;
  pricePerTicket: number;     // Organizer-set price — Tikiti never changes this
  currency: SupportedCurrency;
  quantity: number;
  isVirtual: boolean;
}

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;        // Sum of all (pricePerTicket × quantity)
  tikitiFee: number;          // 5% of totalAmount
  grandTotal: number;         // totalAmount + tikitiFee
  currency: SupportedCurrency;
  addToCart: (
    event: import('./event').TikitiEvent,
    ticketType: import('./event').TicketType,
    quantity: number,
    isVirtual: boolean
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (eventId: string) => boolean;
  setCurrency: (currency: SupportedCurrency) => void;
}

export interface Ticket {
  ticketId: string;
  orderId: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventImageUrl: string;
  eventDate: Date;
  eventVenue: string;
  eventCity: string;
  organizerId: string;
  ticketType: string;
  price: number;              // What buyer paid (organizer price only — no Tikiti fee shown)
  tikitiFee: number;          // 5% deducted from organizer payout (recorded for accounting)
  organizerPayout: number;    // price - tikitiFee = what organizer receives
  currency: SupportedCurrency;
  qrCodeData: string;
  paymentMethod: PaymentMethod;
  status: TicketStatus;
  isVirtual: boolean;
  streamToken?: string;
  checkedIn: boolean;
  checkedInAt: Date | null;
  checkedInBy: string | null;
  purchasedAt: Date;
  refundedAt: Date | null;
}

export interface OrderSummary {
  orderId: string;
  userId: string;
  items?: CartItem[];          // V1 stores full items, V2 stores ticketCount
  ticketCount?: number;        // V2 field
  subtotal: number;
  tikitiFee: number;
  grandTotal: number;
  currency: SupportedCurrency;
  paymentMethod: PaymentMethod;
  phoneNumber?: string | null;
  paymentStatus?: 'pending' | 'completed' | 'failed';  // V2 field
  status?: 'pending' | 'active' | 'failed' | 'refunded';  // V1 field
  ticketIds: string[];
  createdAt: Date;
  updatedAt?: Date;
  paidAt?: Date | null;
}
