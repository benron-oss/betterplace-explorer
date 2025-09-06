
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 text-lg">Searching...</p>
    </div>
  );
};

export default LoadingSpinner;
