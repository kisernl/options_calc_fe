import React from 'react';
import { Calendar } from 'lucide-react';

interface ExpirationDateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

const ExpirationDateSelector: React.FC<ExpirationDateSelectorProps> = ({
  selectedDate,
  onSelect,
  isLoading = false,
  disabled = false,
  minDate,
  maxDate,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading dates...</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      <input
        type="date"
        value={selectedDate || ''}
        onChange={(e) => onSelect(e.target.value)}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default ExpirationDateSelector;