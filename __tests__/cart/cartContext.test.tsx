import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/lib/contexts/CartContext';

// Mock event data
const mockEvent = {
  eventId: 'event-001',
  title: 'Test Concert',
  imageUrl: '/test.jpg',
  dateTime: new Date('2026-06-01T20:00:00'),
  location: { venue: 'KICC', city: 'Nairobi' },
  organizerId: 'org-001',
  hasVirtualTickets: true,
  ticketTypes: [],
};

const mockTicketType = {
  type: 'Regular',
  price: 1000,
  quantity: 100,
  sold: 0,
};

const wrapper = ({ children }: any) => <CartProvider>{children}</CartProvider>;

describe('Cart Context', () => {

  test('A.3.1 — cart starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  test('A.3.2 — adds item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, mockTicketType, 1, false); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(1);
  });

  test('A.3.3 — ticket price is ORGANIZER price unchanged (Ksh 1000)', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, mockTicketType, 1, false); });
    // CRITICAL: price must be exactly what organizer set — no auto-modification
    expect(result.current.items[0].pricePerTicket).toBe(1000);
  });

  test('A.3.4 — 5% Tikiti fee calculated correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, mockTicketType, 2, false); });
    // 2 tickets × Ksh 1000 = Ksh 2000 subtotal
    // 5% fee = Ksh 100
    // Grand total = Ksh 2100
    expect(result.current.totalAmount).toBe(2000);
    expect(result.current.tikitiFee).toBe(100);
    expect(result.current.grandTotal).toBe(2100);
  });

  test('A.3.5 — blocks virtual ticket on event with hasVirtualTickets=false', () => {
    const noVirtualEvent = { ...mockEvent, hasVirtualTickets: false };
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(noVirtualEvent, mockTicketType, 1, true); });
    // Item should NOT be added
    expect(result.current.items).toHaveLength(0);
  });

  test('A.3.6 — same ticket type increments quantity, not duplicates', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, mockTicketType, 1, false); });
    act(() => { result.current.addToCart(mockEvent, mockTicketType, 1, false); });
    // Should be 1 item with quantity 2, not 2 items
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  test('A.3.7 — blocks purchase when tickets sold out', () => {
    const soldOutTicket = { ...mockTicketType, sold: 100, quantity: 100 };
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, soldOutTicket, 1, false); });
    expect(result.current.items).toHaveLength(0);
  });

  test('A.3.8 — blocks quantity exceeding remaining stock', () => {
    const limitedTicket = { ...mockTicketType, sold: 98, quantity: 100 };
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, limitedTicket, 5, false); });
    // Only 2 tickets left — should be blocked
    expect(result.current.items).toHaveLength(0);
  });

  test('A.3.9 — remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, mockTicketType, 1, false); });
    const itemId = result.current.items[0].cartItemId;
    act(() => { result.current.removeFromCart(itemId); });
    expect(result.current.items).toHaveLength(0);
  });

  test('A.3.10 — clear cart empties everything', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.addToCart(mockEvent, mockTicketType, 3, false); });
    act(() => { result.current.clearCart(); });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.tikitiFee).toBe(0);
    expect(result.current.grandTotal).toBe(0);
  });
});
