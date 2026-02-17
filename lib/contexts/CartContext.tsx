'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { CartItem, CartContextType, SupportedCurrency } from '@/types/ticket';
import { TikitiEvent, TicketType } from '@/types/event';
import { detectUserCurrency } from '@/lib/utils/currency';

const TIKITI_FEE_PERCENT = 0.05; // 5% fee on every ticket
const CART_KEY = 'tikiti_cart_v2';
const CURRENCY_KEY = 'tikiti_currency';

// ── Reducer ──────────────────────────────────────────────────────────────────

type CartAction =
  | { type: 'ADD'; payload: CartItem }
  | { type: 'REMOVE'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { id: string; qty: number } }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; payload: CartItem[] };

function reducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      // If same event + same ticket type + same isVirtual already in cart → increment qty
      const existing = state.find(
        (i) =>
          i.eventId === action.payload.eventId &&
          i.ticketType === action.payload.ticketType &&
          i.isVirtual === action.payload.isVirtual
      );
      if (existing) {
        return state.map((i) =>
          i.cartItemId === existing.cartItemId
            ? { ...i, quantity: i.quantity + action.payload.quantity }
            : i
        );
      }
      return [...state, action.payload];
    }
    case 'REMOVE':
      return state.filter((i) => i.cartItemId !== action.payload);
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.cartItemId === action.payload.id
          ? { ...i, quantity: Math.max(1, action.payload.qty) }
          : i
      );
    case 'CLEAR':
      return [];
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [currency, setCurrencyState] = useState<SupportedCurrency>('KES');

  // Hydrate on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).map((i: any) => ({
          ...i,
          eventDate: new Date(i.eventDate),
        }));
        dispatch({ type: 'HYDRATE', payload: parsed });
      }
      const savedCurrency = localStorage.getItem(CURRENCY_KEY) as SupportedCurrency;
      setCurrencyState(savedCurrency || (detectUserCurrency() as SupportedCurrency));
    } catch {
      localStorage.removeItem(CART_KEY);
    }
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // ── addToCart ─────────────────────────────────────────────────────────────
  // IMPORTANT: ticketType.price is the organizer's price — we never override it
  const addToCart = (
    event: TikitiEvent,
    ticketType: TicketType,
    quantity: number,
    isVirtual: boolean
  ) => {
    // Block virtual add if event doesn't have virtual tickets
    if (isVirtual && !event.hasVirtualTickets) {
      toast.error('This event does not offer virtual tickets');
      return;
    }

    // Check availability
    const remaining = ticketType.quantity - ticketType.sold;
    if (remaining < quantity) {
      toast.error(
        remaining === 0
          ? `${ticketType.type} tickets are sold out`
          : `Only ${remaining} ${ticketType.type} tickets left`
      );
      return;
    }

    const item: CartItem = {
      cartItemId: uuidv4(),
      eventId: event.eventId,
      eventTitle: event.title,
      eventImageUrl: event.imageUrl,
      eventDate: event.dateTime,
      eventVenue: event.location.venue,
      eventCity: event.location.city,
      organizerId: event.organizerId,
      ticketType: ticketType.type,
      pricePerTicket: ticketType.price,   // ORGANIZER price — unchanged
      currency: currency,
      quantity,
      isVirtual,
    };

    dispatch({ type: 'ADD', payload: item });
    toast.success(`Added to cart!`, {
      description: `${event.title} — ${ticketType.type}`,
      action: { label: 'View Cart', onClick: () => window.location.href = '/cart' },
    });
  };

  const removeFromCart = (cartItemId: string) => {
    dispatch({ type: 'REMOVE', payload: cartItemId });
    toast.info('Item removed');
  };

  const updateQuantity = (cartItemId: string, qty: number) => {
    dispatch({ type: 'UPDATE_QTY', payload: { id: cartItemId, qty } });
  };

  const clearCart = () => dispatch({ type: 'CLEAR' });

  const isInCart = (eventId: string) => items.some((i) => i.eventId === eventId);

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    localStorage.setItem(CURRENCY_KEY, c);
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalAmount = items.reduce((s, i) => s + i.pricePerTicket * i.quantity, 0);
  const tikitiFee = Math.round(totalAmount * TIKITI_FEE_PERCENT);
  const grandTotal = totalAmount + tikitiFee;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, itemCount, totalAmount, tikitiFee, grandTotal,
      currency, addToCart, removeFromCart, updateQuantity,
      clearCart, isInCart, setCurrency,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
