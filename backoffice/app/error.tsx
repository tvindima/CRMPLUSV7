'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center p-8 bg-gray-900 rounded-lg border border-gray-800 max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Algo correu mal</h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'Ocorreu um erro inesperado'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
