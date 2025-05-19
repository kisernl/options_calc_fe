import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { 
  calculateOptionMetrics, 
  calculateDaysToExpiration, 
  calculateAnnualizedReturn,
  formatCurrency,
  formatPercentage 
} from '../calculationUtils';
import { OptionType } from '../../types';

describe('Calculation Utilities', () => {
  const mockDate = new Date('2023-01-01T12:00:00Z');
  
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('calculateDaysToExpiration', () => {
    test('should calculate days to expiration correctly', () => {
      // Mock the current date to be 2023-01-01
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));

      // 30 days in the future
      expect(calculateDaysToExpiration('2023-01-31')).toBe(30);
      
      // Same day
      expect(calculateDaysToExpiration('2023-01-01')).toBe(0);
      
      // Past date
      expect(calculateDaysToExpiration('2022-12-01')).toBe(0);
    });
  });

  describe('calculateAnnualizedReturn', () => {
    test('should calculate annualized return correctly', () => {
      // 10% return over 30 days should be approximately 44.2% annualized
      expect(calculateAnnualizedReturn(10, 30)).toBeCloseTo(121.7, 1);
      
      // 0% return
      expect(calculateAnnualizedReturn(0, 30)).toBe(0);
      
      // Negative return
      expect(calculateAnnualizedReturn(-50, 30)).toBeLessThan(0);
    });
    
    test('should handle zero return correctly', () => {
      expect(calculateAnnualizedReturn(0, 30)).toBe(0);
    });
  });

  describe('calculateOptionMetrics - PUT options', () => {
    const baseParams = {
      optionType: 'PUT' as OptionType,
      stockPrice: 100,
      strikePrice: 95,
      premium: 2.5,
      expirationDate: '2023-02-01',
      numberOfContracts: 1,
    };

    test('should calculate cash-secured put metrics correctly', () => {
      const result = calculateOptionMetrics(
        baseParams.optionType,
        baseParams.stockPrice,
        baseParams.strikePrice,
        baseParams.premium,
        baseParams.expirationDate,
        baseParams.numberOfContracts
      );

      // 31 days from mock date (2023-01-01 to 2023-02-01)
      expect(result.daysToExpiration).toBe(31);
      
      // Premium = $2.5 * 100 shares * 1 contract = $250
      expect(result.premium).toBe(250);
      
      // Capital required = strike * 100 * contracts = 95 * 100 * 1 = 9500
      expect(result.capitalRequired).toBe(9500);
      
      // Return on capital = (premium / capitalRequired) * 100 = (250 / 9500) * 100 ≈ 2.63%
      expect(result.returnOnCapital).toBeCloseTo(2.63, 2);
      
      // Annualized return should be positive
      expect(result.annualizedReturn).toBeGreaterThan(0);
    });

    test('should handle multiple contracts', () => {
      const result = calculateOptionMetrics(
        baseParams.optionType,
        baseParams.stockPrice,
        baseParams.strikePrice,
        baseParams.premium,
        baseParams.expirationDate,
        5 // 5 contracts
      );

      // Premium = $2.5 * 100 shares * 5 contracts = $1,250
      expect(result.premium).toBe(1250);
      
      // Capital required = $95 * 100 shares * 5 contracts = $47,500
      expect(result.capitalRequired).toBe(47500);
    });
  });

  describe('calculateOptionMetrics - CALL options', () => {
    const baseParams = {
      optionType: 'CALL' as OptionType,
      stockPrice: 100,
      strikePrice: 105,
      premium: 3.0,
      expirationDate: '2023-02-01',
      numberOfContracts: 1,
    };

    test('should calculate covered call metrics without owned shares', () => {
      const result = calculateOptionMetrics(
        baseParams.optionType,
        baseParams.stockPrice,
        baseParams.strikePrice,
        baseParams.premium,
        baseParams.expirationDate,
        baseParams.numberOfContracts
      );

      // Premium = $3.0 * 100 shares * 1 contract = $300
      expect(result.premium).toBe(300);
      
      // Capital required = $100 * 100 shares * 1 contract = $10,000 (current stock price)
      expect(result.capitalRequired).toBe(10000);
      
      // Return on capital = (300 / 10000) * 100 = 3%
      expect(result.returnOnCapital).toBe(3);
    });

    test('should calculate covered call metrics with owned shares', () => {
      const purchasePrice = 90; // User bought shares at $90
      const result = calculateOptionMetrics(
        baseParams.optionType,
        baseParams.stockPrice,
        baseParams.strikePrice,
        baseParams.premium,
        baseParams.expirationDate,
        baseParams.numberOfContracts,
        true,  // ownShares
        purchasePrice
      );

      // Capital required = $90 * 100 shares * 1 contract = $9,000 (purchase price)
      expect(result.capitalRequired).toBe(9000);
      
      // Return on capital = (300 / 9000) * 100 = ~3.33%
      expect(result.returnOnCapital).toBeCloseTo(3.33, 2);
    });
  });

  describe('formatCurrency', () => {
    test('should format numbers as currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  describe('formatPercentage', () => {
    test('should format numbers as percentages', () => {
      // formatPercentage multiplies by 100 and adds %
      expect(formatPercentage(0.05)).toBe('5.00%');
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(1.5)).toBe('150.00%');
      expect(formatPercentage(-0.1)).toBe('-10.00%');
    });
  });
});
