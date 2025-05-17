import React, { useState } from 'react';
import { Search, XCircle, Loader2 } from 'lucide-react';
import { getStockPrice } from '../services/alpacaService';
import { StockData } from '../types';

interface StockSymbolInputProps {
  onStockSelect: (stock: StockData) => void;
}

const StockSymbolInput: React.FC<StockSymbolInputProps> = ({ onStockSelect }) => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value.toUpperCase());
    setError('');
  };
  
  const handleClear = () => {
    setSymbol('');
    setError('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol.trim()) {
      setError('Stock symbol is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const stockData = await getStockPrice(symbol);
      onStockSelect(stockData);
      
    } catch (err) {
      setError('Failed to fetch stock data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={symbol}
            onChange={handleSymbolChange}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className={`w-full px-4 py-3 pl-10 pr-12 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          
          {symbol && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-12 flex items-center pr-2"
            >
              <XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading || !symbol.trim()}
          className="absolute right-0 inset-y-0 px-4 bg-blue-600 text-white rounded-r-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Go'
          )}
        </button>
      </form>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 animate-fadeIn">{error}</p>
      )}
    </div>
  );
};

export default StockSymbolInput;