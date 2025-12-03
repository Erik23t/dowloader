import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 w-full">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
      </div>
      <p className="mt-4 text-gray-400 text-sm font-medium tracking-wide">Carregando galeria...</p>
    </div>
  );
};

export default Loader;