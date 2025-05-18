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
  // Create dates at noon UTC to avoid timezone issues
  const today = new Date();
  const todayNoon = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0));
  
  const exp = new Date(expirationDate);
  const expNoon = new Date(Date.UTC(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate(), 12, 0, 0));
  
  const diffMs = expNoon.getTime() - todayNoon.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const calculateAnnualizedReturn = (returnOnCapital: number, daysToExpiration: number): number => {
  if (daysToExpiration <= 0 || returnOnCapital <= -100) {
    return 0;
  }
  
  // Simple interest calculation: (return / days) * 365
  const dailyReturn = returnOnCapital / daysToExpiration;
  const annualized = dailyReturn * 365;
  
  // Round to 1 decimal place
  return parseFloat(annualized.toFixed(1));
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
  }).format(value);
};