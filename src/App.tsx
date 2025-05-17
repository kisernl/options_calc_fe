import React from 'react';
import { CircleDollarSign } from 'lucide-react';
import OptionsCalculator from './components/OptionsCalculator';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <CircleDollarSign className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Options Calculator</h1>
            </div>
            <div className="text-sm text-gray-500">
              Cash Secured Puts & Covered Calls
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OptionsCalculator />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Options Calculator. All rights reserved. This is for educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;