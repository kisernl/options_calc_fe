import React from 'react';
import { 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Coins, 
  Percent, 
  TrendingUp,
  Info
} from 'lucide-react';
import { CalculationResult } from '../types';
import { formatCurrency, formatPercentage } from '../utils/calculationUtils';

interface CalculationResultsProps {
  result: CalculationResult | null;
  optionType: 'PUT' | 'CALL';
}

const ResultCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  suffix?: string;
  tooltip?: string;
}> = ({ title, value, icon, suffix, tooltip }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col">
    <div className="flex items-center mb-2 text-gray-600">
      {icon}
      <span className="ml-2 text-sm font-medium">{title}</span>
      {tooltip && (
        <div className="relative ml-1 group">
          <Info className="w-4 h-4 text-gray-400" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
    <div className="text-lg sm:text-xl font-bold text-gray-900 mt-auto">
      {value}
      {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
    </div>
  </div>
);

const CalculationResults: React.FC<CalculationResultsProps> = ({ result, optionType }) => {
  if (!result) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-500">
          Enter the required information above to see calculation results
        </p>
      </div>
    );
  }
  
  const {
    premium,
    premiumPerShare,
    returnOnCapital,
    daysToExpiration,
    annualizedReturn,
    capitalRequired,
  } = result;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ResultCard 
          title="Premium" 
          value={formatCurrency(premium)}
          icon={<DollarSign className="w-5 h-5" />}
          tooltip="Total premium received from selling the option"
        />
        <ResultCard 
          title="Premium Per Share" 
          value={formatCurrency(premiumPerShare)}
          icon={<Coins className="w-5 h-5" />}
          tooltip="Premium received per share"
        />
        <ResultCard 
          title="Return On Capital" 
          value={formatPercentage(returnOnCapital)}
          icon={<Percent className="w-5 h-5" />}
          tooltip="Premium received divided by capital required"
        />
        <ResultCard 
          title="Days To Expiration" 
          value={daysToExpiration}
          icon={<Calendar className="w-5 h-5" />}
          suffix="days"
          tooltip="Number of days until the option expires"
        />
        <ResultCard 
          title="Annualized Return" 
          value={formatPercentage(annualizedReturn)}
          icon={<TrendingUp className="w-5 h-5" />}
          tooltip="Return on capital annualized to 365 days"
        />
        <ResultCard 
          title="Capital Required" 
          value={formatCurrency(capitalRequired)}
          icon={<BarChart3 className="w-5 h-5" />}
          tooltip={optionType === 'PUT' 
            ? "Amount needed to secure the put option" 
            : "Value of shares needed for covered call"
          }
        />
      </div>
      
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mt-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <Info className="w-4 h-4 mr-1" />
          What This Means:
        </h3>
        <p className="text-sm text-blue-700">
          {optionType === 'PUT' ? (
            <>
              By selling this cash secured put, you will receive <strong>{formatCurrency(premium)}</strong> in premium.
              You'll need <strong>{formatCurrency(capitalRequired)}</strong> in cash to secure this position.
              If the stock stays above the strike price by expiration, you keep the premium for a {formatPercentage(returnOnCapital)} return ({formatPercentage(annualizedReturn)} annualized).
            </>
          ) : (
            <>
              By selling this covered call, you will receive <strong>{formatCurrency(premium)}</strong> in premium.
              You'll need shares worth <strong>{formatCurrency(capitalRequired)}</strong> to cover this position.
              If the stock stays below the strike price by expiration, you keep the premium for a {formatPercentage(returnOnCapital)} return ({formatPercentage(annualizedReturn)} annualized).
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default CalculationResults;