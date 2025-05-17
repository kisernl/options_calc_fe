import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ExpirationDateSelectorProps {
  expirationDates: string[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const ExpirationDateSelector: React.FC<ExpirationDateSelectorProps> = ({
  expirationDates,
  selectedDate,
  onDateSelect,
  isLoading,
  disabled,
}) => {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
        <Loader2 className="w-5 h-5 mr-2 text-blue-500 animate-spin" />
        <span>Loading expiration dates...</span>
      </div>
    );
  }
  
  if (!expirationDates.length) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
        <p className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          <span>Enter a stock symbol to see available expiration dates</span>
        </p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {expirationDates.map((date) => (
          <button
            key={date}
            onClick={() => onDateSelect(date)}
            disabled={disabled}
            className={`py-2 px-4 rounded-md flex items-center justify-center transition-all duration-200 ${
              selectedDate === date
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(date)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExpirationDateSelector;