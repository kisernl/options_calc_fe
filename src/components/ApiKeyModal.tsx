import React, { useState, useEffect } from "react";
import { Key, X, RefreshCw } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  useEffect(() => {
    if (isOpen) {
      const savedApiKey = localStorage.getItem("alpaca_api_key") || "";
      const savedApiSecret = localStorage.getItem("alpaca_api_secret") || "";
      setApiKey(savedApiKey);
      setApiSecret(savedApiSecret);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("alpaca_api_key", apiKey);
    localStorage.setItem("alpaca_api_secret", apiSecret);
    onClose();
  };

  const handleReset = () => {
    localStorage.removeItem("alpaca_api_key");
    localStorage.removeItem("alpaca_api_secret");
    setApiKey("");
    setApiSecret("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Alpaca API Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Alpaca API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Alpaca API secret"
            />
          </div>

          <p className="text-sm text-gray-500">
            Your API credentials will be stored securely in your browser's local
            storage.
          </p>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Keys
            </button>

            <div className="space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
