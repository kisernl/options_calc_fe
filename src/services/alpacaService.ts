import axios from "axios";
import { StockData, OptionChain, OptionContract } from "../types";

const getApiCredentials = () => {
  const apiKey = localStorage.getItem("alpaca_api_key");
  const apiSecret = localStorage.getItem("alpaca_api_secret");
  return { apiKey, apiSecret };
};

const BASE_URL = "https://data.alpaca.markets/v2";
const OPTIONS_BASE_URL = "https://paper-api.alpaca.markets/v2";

// Create an axios instance with dynamic headers
const createAlpacaApi = (isOptionsApi: boolean = false) => {
  const { apiKey, apiSecret } = getApiCredentials();

  return axios.create({
    baseURL: isOptionsApi ? OPTIONS_BASE_URL : BASE_URL,
    headers: {
      "APCA-API-KEY-ID": apiKey || "PK5FA8YP7RMKNRDZCEP3",
      "APCA-API-SECRET-KEY":
        apiSecret || "ZvorcfKK30yt6r1K7vrQxGMWgLZgAWiVUf0ODUfD",
    },
  });
};

export const getStockPrice = async (
  symbol: string,
  price?: number
): Promise<StockData> => {
  const { apiKey, apiSecret } = getApiCredentials();

  if (!apiKey || !apiSecret) {
    throw new Error(
      "API credentials not found. Please set your Alpaca API keys."
    );
  }

  try {
    if (price) {
      // Use the provided price
      return {
        symbol: symbol.toUpperCase(),
        price,
        name: `${symbol.toUpperCase()} Inc.`,
      };
    } else {
      // Make API call to get last price
      const api = createAlpacaApi();
      const response = await api.get(`/stocks/trades/latest?symbols=${symbol}`);
      const lastTrade = response.data.trades[symbol];
      const price = lastTrade.p;

      return {
        symbol: symbol.toUpperCase(),
        price,
        name: `${symbol.toUpperCase()} Inc.`,
      };
    }
  } catch (error) {
    console.error("Error fetching stock price:", error);
    throw new Error("Failed to fetch stock price");
  }
};

export const getOptionChain = async (
  symbol: string,
  stockPrice: number,
  expirationDate?: string
): Promise<OptionChain> => {
  try {
    const { apiKey, apiSecret } = getApiCredentials();
    console.log('API Credentials:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret
    });

    const api = createAlpacaApi(true); // Use options API
    
    console.log('Fetching options for symbol:', symbol);
    const response = await api.get(`/options/contracts`, {
      params: {
        underlying_symbols: symbol,
        limit: 100,
        expiration_date: expirationDate
      }
    });

    console.log('API Response:', {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
      dataKeys: Object.keys(response.data),
      dataType: typeof response.data
    });

    // First, let's check if we got an array
    if (!Array.isArray(response.data)) {
      console.log('Response data is not an array:', response.data);
      // If not an array, try to access the contracts directly
      const contracts = response.data?.contracts || response.data?.option_contracts;
      if (!contracts) {
        throw new Error('Invalid response format from API - no contracts found');
      }
      console.log('Contracts found in nested structure:', contracts);
    }

    // The API returns an array of contracts
    const contracts = Array.isArray(response.data) ? response.data : response.data?.contracts || response.data?.option_contracts;
    
    if (!contracts) {
      throw new Error('No contracts data found in response');
    }

    // Filter for call options only
    const callContracts = contracts.filter((contract: any) => contract.type === 'call');
    
    if (callContracts.length === 0) {
      console.log('No call options found in response:', contracts);
      throw new Error('No call options found for this symbol');
    }

    // Extract unique expiration dates from call contracts
    const expirationDates = Array.from(new Set<string>(
      callContracts.map((contract: any) => contract.expiration_date)
    ))
    .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());

    // Get next 5 dates
    const selectedDates = expirationDates.slice(0, 5);

    // If an expiration date was provided, filter by that date
    const filteredContracts = expirationDate 
      ? callContracts.filter((contract: any) => contract.expiration_date === expirationDate)
      : callContracts;

    // Extract strike prices and sort them
    const strikePrices = filteredContracts
      .map((contract: any) => parseFloat(contract.strike_price))
      .sort((a: number, b: number) => a - b);

    if (strikePrices.length === 0) {
      throw new Error('No valid strike prices found for selected expiration dates');
    }

    // Find closest strike price to stock price
    const closestStrike = strikePrices.reduce((prev: number, curr: number) => {
      return Math.abs(curr - stockPrice) < Math.abs(prev - stockPrice) ? curr : prev;
    });

    // Get 7 strikes above and below closest strike
    const closestIndex = strikePrices.indexOf(closestStrike);
    const start = Math.max(0, closestIndex - 7);
    const end = Math.min(strikePrices.length, closestIndex + 8);
    const selectedStrikes = strikePrices.slice(start, end);

    // Group contracts by expiration date
    const options: Record<string, OptionContract[]> = {};
    filteredContracts.forEach((contract: any) => {
      const strike = parseFloat(contract.strike_price);
      if (selectedStrikes.includes(strike)) {
        const date = contract.expiration_date;
        if (!options[date]) {
          options[date] = [];
        }
        options[date].push({
          strike_price: strike,
          expiration_date: date,
          premium: parseFloat(contract.premium || '0'),
          type: contract.type,
          underlying_symbol: contract.underlying_symbol,
          underlying_price: parseFloat(contract.underlying_price || '0'),
          delta: contract.delta,
          gamma: contract.gamma,
          theta: contract.theta,
          vega: contract.vega
        });
      }
    });

    console.log('Processed data:', {
      expirationDates: selectedDates.length,
      closestStrike,
      selectedStrikes: selectedStrikes.length,
      groupedContracts: Object.keys(options).length
    });

    return {
      options,
      expirationDates: selectedDates,
      closestStrike,
      selectedStrikes
    };
  } catch (error: any) {
    console.error('Detailed error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    throw new Error(`Failed to fetch option chain for this expiration date &/or stock`);
  }
};

// Add a new function to fetch contracts for a specific expiration date
export const getContractsForExpiration = async (
  symbol: string,
  expirationDate: string
): Promise<OptionContract[]> => {
  try {
    const api = createAlpacaApi(true); // Use options API
    
    const response = await api.get(`/v1beta1/options/contracts`, {
      params: {
        underlying_symbols: symbol,
        expiration_date: expirationDate
      }
    });

    // The API might return the data in different formats
    const contracts = Array.isArray(response.data) 
      ? response.data 
      : response.data.option_contracts 
      ? response.data.option_contracts 
      : response.data.contracts 
      ? response.data.contracts 
      : [];

    if (contracts.length === 0) {
      throw new Error('No option contracts found for this expiration date');
    }

    // Convert to our OptionContract type
    return contracts.map((contract: any) => ({
      strike_price: parseFloat(contract.strike_price),
      expiration_date: contract.expiration_date,
      premium: parseFloat(contract.premium || '0'),
      type: contract.type,
      underlying_symbol: contract.underlying_symbol,
      underlying_price: parseFloat(contract.underlying_price || '0'),
      delta: contract.delta,
      gamma: contract.gamma,
      theta: contract.theta,
      vega: contract.vega
    }));
  } catch (error: any) {
    console.error('Error fetching contracts for expiration:', error);
    throw new Error(`Failed to fetch contracts: ${error.message}`);
  }
};

// Helper function to generate mock expiration dates (next 4 Fridays)
const generateMockExpirationDates = (): string[] => {
  const dates: string[] = [];
  const currentDate = new Date();

  for (let i = 0; i < 4; i++) {
    const daysUntilFriday = ((12 - currentDate.getDay()) % 7) + i * 7;
    const friday = new Date(currentDate);
    friday.setDate(currentDate.getDate() + daysUntilFriday);
    dates.push(friday.toISOString().split("T")[0]);
  }

  return dates;
};

// Helper function to generate mock strike prices
const generateMockStrikePrices = (closestStrike: number): number[] => {
  const strikes: number[] = [];

  for (let i = -7; i <= 7; i++) {
    strikes.push(closestStrike + i * 5);
  }

  return strikes.sort((a, b) => a - b);
};

// Helper function to generate mock premium based on strike and expiration
const generateMockPremium = (
  stockPrice: number,
  strike: number,
  expirationDate: string
): number => {
  const daysToExpiration = getDaysToExpiration(expirationDate);
  const distanceFromCurrent = Math.abs(stockPrice - strike) / stockPrice;

  let premium;
  if (strike < stockPrice) {
    // For strikes below current price
    premium =
      stockPrice *
      0.05 *
      (1 - distanceFromCurrent) *
      Math.sqrt(daysToExpiration / 30);
  } else {
    // For strikes above current price
    premium =
      stockPrice *
      0.03 *
      (1 - distanceFromCurrent) *
      Math.sqrt(daysToExpiration / 30);
  }

  return parseFloat(premium.toFixed(2));
};

// Helper function to calculate days to expiration
const getDaysToExpiration = (expirationDate: string): number => {
  const expiration = new Date(expirationDate);
  const today = new Date();
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
