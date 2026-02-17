/**
 * Unit Test: CapacityBar Component
 * 
 * Tests the real-time capacity display component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CapacityBar from '@/components/events/CapacityBar';

expect.extend(toHaveNoViolations);

// Mock Firestore
const mockOnSnapshot = jest.fn();
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: mockOnSnapshot,
}));

describe('CapacityBar', () => {
  const defaultProps = {
    eventId: 'test-event-001',
    initialCurrent: 50,
    total: 100,
    showDetails: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render initial capacity correctly', () => {
    render(<CapacityBar {...defaultProps} />);
    
    expect(screen.getByText('50 / 100')).toBeInTheDocument();
    expect(screen.getByText('50% Full')).toBeInTheDocument();
  });

  it('should show green color when capacity is below 70%', () => {
    render(<CapacityBar {...defaultProps} initialCurrent={60} total={100} />);
    
    const percentage = screen.getByText('60% Full');
    expect(percentage).toHaveClass('text-green-600');
  });

  it('should show orange color when capacity is 70-90%', () => {
    render(<CapacityBar {...defaultProps} initialCurrent={75} total={100} />);
    
    const percentage = screen.getByText('75% Full');
    expect(percentage).toHaveClass('text-orange-600');
  });

  it('should show red color when capacity is above 90%', () => {
    render(<CapacityBar {...defaultProps} initialCurrent={95} total={100} />);
    
    const percentage = screen.getByText('95% Full');
    expect(percentage).toHaveClass('text-red-600');
  });

  it('should display alert banner at 85%+ capacity', () => {
    render(<CapacityBar {...defaultProps} initialCurrent={85} total={100} />);
    
    expect(screen.getByText(/Venue is nearing capacity/)).toBeInTheDocument();
  });

  it('should not show details when showDetails is false', () => {
    render(<CapacityBar {...defaultProps} showDetails={false} />);
    
    expect(screen.queryByText('50 / 100')).not.toBeInTheDocument();
  });

  it('should update capacity in real-time', async () => {
    // Mock Firestore snapshot
    mockOnSnapshot.mockImplementation((docRef, callback) => {
      // Immediately call with initial data
      callback({
        exists: () => true,
        data: () => ({ currentCapacity: 60 }),
      });
      
      // Simulate update after 100ms
      setTimeout(() => {
        callback({
          exists: () => true,
          data: () => ({ currentCapacity: 70 }),
        });
      }, 100);
      
      return jest.fn(); // Unsubscribe function
    });

    render(<CapacityBar {...defaultProps} />);
    
    // Should show updated capacity
    await waitFor(() => {
      expect(screen.getByText('70 / 100')).toBeInTheDocument();
    });
  });

  it('should cleanup listener on unmount', () => {
    const mockUnsubscribe = jest.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<CapacityBar {...defaultProps} />);
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<CapacityBar {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle missing Firestore gracefully', () => {
    // Mock db as null
    jest.mock('@/lib/firebase/config', () => ({
      db: null,
    }));

    render(<CapacityBar {...defaultProps} />);
    
    // Should still render with initial values
    expect(screen.getByText('50 / 100')).toBeInTheDocument();
  });
});
