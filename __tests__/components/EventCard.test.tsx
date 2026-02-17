/**
 * Unit Test: EventCard Component
 * 
 * Tests the EventCard component rendering and interactions
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import EventCard from '@/components/events/EventCard';
import { TikitiEvent } from '@/types/event';

expect.extend(toHaveNoViolations);

// Mock data
const mockEvent: TikitiEvent = {
  eventId: 'test-event-001',
  title: 'Test Concert 2026',
  description: 'An amazing test concert',
  category: 'music',
  dateTime: new Date('2026-06-15T19:00:00'),
  endDateTime: new Date('2026-06-15T23:00:00'),
  location: {
    venue: 'Test Arena',
    city: 'Nairobi',
    address: '123 Test St',
    coordinates: { lat: 0, lng: 0 },
  },
  ticketTypes: [
    {
      typeId: 'regular',
      name: 'Regular',
      price: 1000,
      quantity: 100,
      sold: 50,
      isVirtual: false,
    },
  ],
  imageUrl: 'https://example.com/event.jpg',
  organizerId: 'org-001',
  organizerName: 'Test Organizer',
  status: 'upcoming',
  venueCapacity: 500,
  currentCapacity: 250,
  hasVirtualTickets: false,
  verified: true,
  featured: false,
  tags: ['music', 'concert'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock hooks
jest.mock('@/lib/contexts/CartContext', () => ({
  useCart: () => ({
    addToCart: jest.fn(),
    isInCart: jest.fn(() => false),
    cart: [],
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    cartTotal: 0,
  }),
}));

jest.mock('@/lib/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorited: jest.fn(() => false),
    toggleFavorite: jest.fn(),
    favorites: [],
  }),
}));

describe('EventCard', () => {
  it('should render event details correctly', () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('Test Concert 2026')).toBeInTheDocument();
    expect(screen.getByText(/Test Arena/)).toBeInTheDocument();
    expect(screen.getByText(/Ksh 1,000/)).toBeInTheDocument();
  });

  it('should display verified badge when event is verified', () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText(/Verified/)).toBeInTheDocument();
  });

  it('should show capacity percentage', () => {
    render(<EventCard event={mockEvent} />);
    
    // 250/500 = 50%
    expect(screen.getByText(/50% Full/)).toBeInTheDocument();
  });

  it('should handle add to cart click', () => {
    const { useCart } = require('@/lib/contexts/CartContext');
    const mockAddToCart = jest.fn();
    useCart.mockReturnValue({
      addToCart: mockAddToCart,
      isInCart: jest.fn(() => false),
      cart: [],
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      cartTotal: 0,
    });

    render(<EventCard event={mockEvent} />);
    
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);
    
    expect(mockAddToCart).toHaveBeenCalledWith(
      mockEvent,
      mockEvent.ticketTypes[0],
      1,
      false
    );
  });

  it('should handle favorite toggle', () => {
    const { useFavorites } = require('@/lib/hooks/useFavorites');
    const mockToggleFavorite = jest.fn();
    useFavorites.mockReturnValue({
      isFavorited: jest.fn(() => false),
      toggleFavorite: mockToggleFavorite,
      favorites: [],
    });

    render(<EventCard event={mockEvent} />);
    
    const favoriteButton = screen.getByLabelText(/Add to favorites/i);
    fireEvent.click(favoriteButton);
    
    expect(mockToggleFavorite).toHaveBeenCalledWith('test-event-001');
  });

  it('should show "In Cart" when event is already in cart', () => {
    const { useCart } = require('@/lib/contexts/CartContext');
    useCart.mockReturnValue({
      addToCart: jest.fn(),
      isInCart: jest.fn(() => true),
      cart: [],
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      cartTotal: 0,
    });

    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('In Cart')).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<EventCard event={mockEvent} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should apply featured variant styles', () => {
    const { container } = render(<EventCard event={mockEvent} variant="featured" />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('min-w-[300px]');
  });
});
