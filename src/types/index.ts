export type OptionType = 'PUT' | 'CALL';

export interface StockData {
  symbol: string;
  price: number;
  name?: string;
}

export interface OptionData {
  expirationDate: string;
  strikePrice: number;
  premium: number;
}

export interface OptionChain {
  options: Record<string, OptionContract[]>;
  expirationDates: string[];
  closestStrike: number | null;
  selectedStrikes: number[];
}

export interface OptionContract {
  strike_price: number;
  expiration_date: string;
  premium: number;
  type: 'call' | 'put';
  underlying_symbol: string;
  underlying_price: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface CalculationResult {
  premium: number;
  premiumPerShare: number;
  returnOnCapital: number;
  daysToExpiration: number;
  annualizedReturn: number;
  capitalRequired: number;
}