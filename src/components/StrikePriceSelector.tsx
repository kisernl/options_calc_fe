import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { OptionContract } from '../types';

interface StrikePriceSelectorProps {
  options: OptionContract[] | null;
  selectedStrike: number | null;
  onStrikeSelect: (strike: number) => void;
  stockPrice: number;
  isLoading: boolean;
  disabled: boolean;
  optionType: 'CALL' | 'PUT';
}

const StrikePriceSelector: React.FC<StrikePriceSelectorProps> = ({
  options,
  selectedStrike,
  onStrikeSelect,
  stockPrice,
  isLoading,
  disabled,
  optionType,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
        <Loader2 className="w-5 h-5 mr-2 text-blue-500 animate-spin" />
        <span>Loading strike prices...</span>
      </div>
    );
  }
  
  if (!options || !options.length) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
        <p className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          <span>No option contracts available for this expiration date</span>
        </p>
      </div>
    );
  }
  
  // Sort options by strike price
  const sortedOptions = [...options].sort((a, b) => a.strike_price - b.strike_price);
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-7 gap-2">
        {sortedOptions.map((option) => {
          const isAboveStock = option.strike_price > stockPrice;
          const isBelowStock = option.strike_price < stockPrice;
          const isAtStock = Math.abs(option.strike_price - stockPrice) < 0.01;
          
          return (
            <button
              key={`${option.strike_price}-${optionType}`}
              onClick={() => onStrikeSelect(option.strike_price)}
              disabled={disabled}
              className={`relative py-3 px-2 rounded-md flex flex-col items-center justify-center transition-all duration-200 ${
                selectedStrike === option.strike_price
                  ? 'bg-blue-100 text-blue-600 shadow-md border-blue-600' // Selected state
                  : `bg-white border text-gray-700 hover:bg-gray-50 ${
                      isAtStock 
                        ? 'border-green-500 border-2' 
                        : (optionType === 'PUT' && isAboveStock) || (optionType === 'CALL' && isBelowStock)
                          ? 'border-red-200 bg-red-50'
                          : 'border-green-200 bg-green-50'
                    }`
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="font-semibold">${option.strike_price.toFixed(2)}</span>
              {!isAtStock && selectedStrike !== option.strike_price && (
                <div className="absolute top-1 right-1">
                  {optionType === 'PUT' ? (
                    <TrendingDown className={`w-3 h-3 ${
                      isAboveStock ? 'text-red-500' : 'text-green-500'
                    }`} />
                  ) : (
                    <TrendingUp className={`w-3 h-3 ${
                      isBelowStock ? 'text-red-500' : 'text-green-500'
                    }`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StrikePriceSelector;