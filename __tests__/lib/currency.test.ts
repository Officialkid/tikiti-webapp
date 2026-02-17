/**
 * Unit Test: Currency Utility Functions
 * 
 * Tests the currency formatting utilities
 */

import { formatCurrency, convertCurrency } from '@/lib/utils/currency';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format KES currency correctly', () => {
      expect(formatCurrency(1000, 'KES')).toBe('Ksh 1,000');
      expect(formatCurrency(1000000, 'KES')).toBe('Ksh 1,000,000');
    });

    it('should format USD currency correctly', () => {
      expect(formatCurrency(100, 'USD')).toBe('$100.00');
      expect(formatCurrency(1000.5, 'USD')).toBe('$1,000.50');
    });

    it('should format GBP currency correctly', () => {
      expect(formatCurrency(50, 'GBP')).toBe('£50.00');
      expect(formatCurrency(999.99, 'GBP')).toBe('£999.99');
    });

    it('should format EUR currency correctly', () => {
      expect(formatCurrency(75, 'EUR')).toBe('€75.00');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('should handle zero amounts', () => {
      expect(formatCurrency(0, 'KES')).toBe('Ksh 0');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500, 'KES')).toBe('Ksh -500');
      expect(formatCurrency(-100.50, 'USD')).toBe('-$100.50');
    });

    it('should handle decimal values for KES', () => {
      expect(formatCurrency(1000.50, 'KES')).toBe('Ksh 1,001'); // Rounds to nearest shilling
    });

    it('should default to KES when currency is not provided', () => {
      expect(formatCurrency(500)).toBe('Ksh 500');
    });
  });

  describe('convertCurrency', () => {
    it('should convert KES to USD', () => {
      const result = convertCurrency(13000, 'KES', 'USD');
      expect(result).toBeCloseTo(100, 2); // 130 KES ≈ 1 USD
    });

    it('should convert USD to KES', () => {
      const result = convertCurrency(100, 'USD', 'KES');
      expect(result).toBeCloseTo(13000, 0);
    });

    it('should convert USD to GBP', () => {
      const result = convertCurrency(100, 'USD', 'GBP');
      expect(result).toBeCloseTo(80, 2); // Approximate rate
    });

    it('should return same amount for same currency', () => {
      expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
      expect(convertCurrency(1000, 'KES', 'KES')).toBe(1000);
    });

    it('should handle zero amounts', () => {
      expect(convertCurrency(0, 'USD', 'KES')).toBe(0);
    });

    it('should throw error for unsupported currency', () => {
      expect(() => {
        convertCurrency(100, 'USD', 'XXX' as any);
      }).toThrow('Unsupported currency');
    });
  });
});
