import { differenceInCalendarDays } from 'date-fns';
import { CalculationResult, OptionType } from '../types';

export const calculateOptionMetrics = (
  optionType: OptionType,
  stockPrice: number,
  strikePrice: number,
  premium: number,
  expirationDate: string,
  numberOfContracts: number,
  ownShares: boolean = false,
  purchasePrice: number = 0
): CalculationResult => {
  const daysToExpiration = calculateDaysToExpiration(expirationDate);
  const premiumTotal = premium * numberOfContracts * 100; // Premium per share * contracts * 100 shares
  
  let capitalRequired: number;
  let returnOnCapital: number;
  
  if (optionType === 'PUT') {
    // Cash Secured Put
    capitalRequired = strikePrice * numberOfContracts * 100;
    returnOnCapital = (premiumTotal / capitalRequired) * 100;
  } else {
    // Covered Call
    if (ownShares) {
      // If user already owns shares, calculate against purchase price
      capitalRequired = purchasePrice * numberOfContracts * 100;
    } else {
      // Otherwise, calculate against current stock price
      capitalRequired = stockPrice * numberOfContracts * 100;
    }
    returnOnCapital = (premiumTotal / capitalRequired) * 100;
  }
  
  // Calculate annualized return
  const annualizedReturn = calculateAnnualizedReturn(returnOnCapital, daysToExpiration);
  
  return {
    premium: premiumTotal,
    premiumPerShare: premium,
    returnOnCapital,
    daysToExpiration,
    annualizedReturn,
    capitalRequired,
  };
};

export const calculateDaysToExpiration = (expirationDate: string): number => {
  const today = new Date();
  const expiration = new Date(expirationDate);
  return differenceInCalendarDays(expiration, today);
};

export const calculateAnnualizedReturn = (returnOnCapital: number, daysToExpiration: number): number => {
  return (returnOnCapital / daysToExpiration) * 365;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};