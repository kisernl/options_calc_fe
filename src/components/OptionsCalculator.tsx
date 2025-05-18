import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BarChart3, TrendingDown, TrendingUp, RefreshCcw, DollarSign, Key } from 'lucide-react';

import StockSymbolInput from './StockSymbolInput';
import ExpirationDateSelector from './ExpirationDateSelector';
import StrikePriceSelector from './StrikePriceSelector';
import CalculationResults from './CalculationResults';
import ApiKeyModal from './ApiKeyModal';

import { getOptionChain } from '../services/alpacaService';
import { calculateOptionMetrics } from '../utils/calculationUtils';
import { StockData, OptionType, OptionChain, CalculationResult, OptionContract } from '../types';

interface CalculatorState {
  stockData: StockData | null;
  optionChain: OptionChain | null;
  selectedExpiration: string | null;
  selectedStrike: number | null;
  optionType: OptionType;
  premium: number;
  numberOfContracts: number;
  ownShares: boolean;
  purchasePrice: number;
}

const initialState: CalculatorState = {
  stockData: null,
  optionChain: null,
  selectedExpiration: null,
  selectedStrike: null,
  optionType: 'PUT',
  premium: 0,
  numberOfContracts: 1,
  ownShares: false,
  purchasePrice: 0,
};

const OptionsCalculator: React.FC = () => {
  // Option type state (PUT or CALL)
  const [optionType, setOptionType] = useState<OptionType>('PUT');
  const [putState, setPutState] = useState<CalculatorState>(initialState);
  const [callState, setCallState] = useState<CalculatorState>(initialState);
  
  // Loading state
  const [loadingOptionChain, setLoadingOptionChain] = useState(false);
  
  // Error state
  const [error, setError] = useState<string>('');
  
  // API key modal state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  // Get current calculator state based on option type
  const getCurrentState = () => {
    return optionType === 'PUT' ? putState : callState;
  };

  const setCurrentState = (newState: Partial<CalculatorState>) => {
    if (optionType === 'PUT') {
      setPutState(prev => ({ ...prev, ...newState }));
    } else {
      setCallState(prev => ({ ...prev, ...newState }));
    }
  };

  // Calculation result
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  // Date selection state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stockSymbolInputRef = useRef<{ reset: () => void }>(null);

  useEffect(() => {
    if (getCurrentState().stockData) {
      fetchOptionChain();
    }
  }, [getCurrentState().stockData]);
  
  useEffect(() => {
    calculateMetrics();
  }, [
    getCurrentState().selectedStrike,
    getCurrentState().premium,
    getCurrentState().numberOfContracts,
    getCurrentState().ownShares,
    getCurrentState().purchasePrice,
    optionType,
  ]);

  useEffect(() => {
    const currentState = getCurrentState();
    if (currentState.stockData) {
      setCalculationResult(null);
    }
  }, [getCurrentState().stockData]);

  useEffect(() => {
    const currentState = getCurrentState();
    if (currentState.selectedExpiration) {
      setCalculationResult(null);
    }
  }, [getCurrentState().selectedExpiration]);

  const fetchOptionChain = async () => {
    const currentState = getCurrentState();
    if (!currentState?.stockData) return;
    
    try {
      setLoadingOptionChain(true);
      setError('');
      
      const { symbol, price } = currentState.stockData;
      if (!symbol || !price) {
        throw new Error('Invalid stock data');
      }
      
      const chain = await getOptionChain(symbol, price);
      
      if (!chain || !chain.expirationDates || chain.expirationDates.length === 0) {
        throw new Error('No option chain found for this stock');
      }

      setCurrentState({
        ...currentState,
        optionChain: chain,
        selectedExpiration: chain.expirationDates[0] || null,
      });
    } catch (error: any) {
      setError(`No option chain found for this stock. Please select another stock.`);
      console.error('Error fetching option chain:', error);
    } finally {
      setLoadingOptionChain(false);
    }
  };
  
  const handleStockSelect = async (stock: StockData) => {
    setIsLoading(true);
    setError('');
    
    // Reset calculation result when stock changes
    setCalculationResult(null);

    try {
      // Clear previous option chain and selections
      setCurrentState({
        optionChain: null,
        selectedExpiration: null,
        selectedStrike: null,
        premium: 0,
        stockData: stock
      });

      const optionChain = await getOptionChain(stock.symbol, stock.price);
      
      setCurrentState({
        optionChain,
        selectedExpiration: optionChain.expirationDates[0] || null,
        selectedStrike: null,
        premium: 0
      });

      setError('');
    } catch (error) {
      console.error('Error fetching option chain:', error);
      setError('Failed to fetch option chain');
      
      // Reset state on error
      setCurrentState({
        stockData: null,
        optionChain: null,
        selectedExpiration: null,
        selectedStrike: null,
        premium: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpirationSelect = async (date: string) => {
    setIsLoading(true);
    setError('');
    
    // Reset calculation result when expiration changes
    setCalculationResult(null);

    try {
      const currentState = getCurrentState();
      
      if (!currentState?.stockData?.symbol || !currentState?.stockData?.price) {
        toast.error('No stock data available');
        setError('No stock data available');
        return;
      }

      const optionChain = await getOptionChain(
        currentState.stockData.symbol, 
        currentState.stockData.price, 
        date
      );
      
      setCurrentState({
        optionChain,
        selectedExpiration: date,
        selectedStrike: null,
        premium: 0
      });
      
      setError('');
    } catch (error) {
      console.error('Error fetching option chain:', error);
      setError('Failed to fetch option chain for selected date');
      
      // Reset state on error
      setCurrentState({
        optionChain: null,
        selectedExpiration: null,
        selectedStrike: null,
        premium: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrikeSelect = (strike: number) => {
    const currentState = getCurrentState();
    
    if (!currentState?.selectedExpiration) {
      toast.error('Please select an expiration date first');
      return;
    }

    if (!currentState?.optionChain) {
      toast.error('No option chain data available');
      return;
    }

    const contracts = currentState.optionChain.options[currentState.selectedExpiration] || [];
    const selectedContract = contracts.find(c => c.strike_price === strike);

    if (!selectedContract) {
      toast.error('No contract found for selected strike');
      return;
    }

    if (optionType === 'PUT') {
      setPutState({
        ...putState,
        selectedStrike: strike,
        premium: selectedContract.premium
      });
    } else {
      setCallState({
        ...callState,
        selectedStrike: strike,
        premium: selectedContract.premium
      });
    }
  };

  const handlePremiumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      if (optionType === 'PUT') {
        setPutState(prev => ({ ...prev, premium: value }));
      } else {
        setCallState(prev => ({ ...prev, premium: value }));
      }
    }
  };

  const handleNumberOfContractsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      if (optionType === 'PUT') {
        setPutState(prev => ({ ...prev, numberOfContracts: value }));
      } else {
        setCallState(prev => ({ ...prev, numberOfContracts: value }));
      }
    }
  };

  const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      if (optionType === 'PUT') {
        setPutState(prev => ({ ...prev, purchasePrice: value }));
      } else {
        setCallState(prev => ({ ...prev, purchasePrice: value }));
      }
    }
  };

  const calculateMetrics = () => {
    const currentState = getCurrentState();
    
    if (!currentState?.stockData || !currentState?.optionChain || !currentState?.selectedStrike || !currentState?.selectedExpiration) {
      setCalculationResult(null);
      return;
    }

    const result = calculateOptionMetrics(
      currentState.optionType,
      currentState.stockData.price,
      currentState.selectedStrike,
      currentState.premium, // Use the premium from state
      currentState.selectedExpiration,
      currentState.numberOfContracts,
      currentState.ownShares,
      currentState.purchasePrice
    );

    setCalculationResult(result);
  };

  const handleReset = () => {
    // Reset both put and call states to initial state
    setPutState({
      ...initialState,
      optionType: 'PUT'
    });
    setCallState({
      ...initialState,
      optionType: 'CALL'
    });
    
    // Reset the selected date
    setSelectedDate(null);
    
    // Reset calculation result
    setCalculationResult(null);
    
    // Clear any errors
    setError('');
    
    // Reset the stock input
    if (stockSymbolInputRef.current) {
      stockSymbolInputRef.current.reset();
    }
    
    // Close any open toasts
    toast.dismiss();
  };

  const getOptionsForSelectedExpiration = (): OptionContract[] => {
    const currentState = getCurrentState();
    if (!currentState?.optionChain || !currentState?.selectedExpiration) {
      return [];
    }

    return currentState.optionChain.options[currentState.selectedExpiration] || [];
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    handleExpirationSelect(date);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
      
      {/* Calculator Type Selector */}
      <div className="flex flex-col sm:flex-row mb-6 gap-4">
        <button
          onClick={() => setOptionType('PUT')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
            optionType === 'PUT'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <TrendingDown className={`w-5 h-5 ${optionType === 'PUT' ? 'text-blue-600' : 'text-gray-500'}`} />
          <span className="font-medium">Cash Secured Put</span>
        </button>
        
        <button
          onClick={() => setOptionType('CALL')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
            optionType === 'CALL'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${optionType === 'CALL' ? 'text-blue-600' : 'text-gray-500'}`} />
          <span className="font-medium">Covered Call</span>
        </button>
      </div>
      
      {/* Main Calculator Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">
              {optionType === 'PUT' ? 'Cash Secured Put Calculator' : 'Covered Call Calculator'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <span className="text-gray-600">API</span>
              <Key className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
        
        {/* Calculator Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Stock Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
                <StockSymbolInput 
                  ref={stockSymbolInputRef}
                  onStockSelect={handleStockSelect} 
                />
              </div>
              
              {(() => {
                const currentState = getCurrentState();
                return currentState.stockData ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
                    <div className="flex items-center h-12 px-4 border border-gray-300 rounded-lg bg-gray-50">
                      <DollarSign className="w-5 h-5 text-gray-400 mr-1" />
                      <span className="font-medium text-gray-800">{currentState.stockData.price.toFixed(2)}</span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          
          {/* Option Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Option Information</h3>
            
            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={selectedDate || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border rounded-md px-3 py-2"
                disabled={isLoading}
              />
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
            </div>
            
            {/* Strike Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strike Price
              </label>
              {!error && (
                <StrikePriceSelector
                  options={getOptionsForSelectedExpiration()}
                  selectedStrike={getCurrentState().selectedStrike}
                  onStrikeSelect={handleStrikeSelect}
                  stockPrice={getCurrentState().stockData?.price || 0}
                  isLoading={isLoading}
                  disabled={isLoading}
                />
              )}
            </div>
            
            {/* Number of Contracts and Premium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Contracts
                </label>
                <input
                  type="number"
                  min="1"
                  value={getCurrentState().numberOfContracts}
                  onChange={handleNumberOfContractsChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Premium Per Share
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={getCurrentState().premium || ""}
                    placeholder="0.00"  
                    onChange={handlePremiumChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Covered Call Specific Inputs */}
            {optionType === 'CALL' && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="ownShares"
                    checked={getCurrentState().ownShares}
                    onChange={(e) => setCallState(prev => ({ ...prev, ownShares: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="ownShares" className="ml-2 text-sm font-medium text-gray-700">
                    I already own the shares
                  </label>
                </div>
                
                {getCurrentState().ownShares && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price Per Share
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={getCurrentState().purchasePrice}
                        onChange={handlePurchasePriceChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Results Section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Results</h3>
            <CalculationResults 
              result={calculationResult} 
              optionType={optionType} 
            />
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>
          This calculator is for educational purposes only. Options trading involves risk. 
          Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  );
};

export default OptionsCalculator;