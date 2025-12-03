'use client';

import { useState } from 'react';

export default function PlayPage() {
  const [message] = useState('Play page - Coming soon!');

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Hunt in Progress</h1>
          <p className="text-gray-600">{message}</p>
          <p className="text-sm text-gray-500 mt-4">
            This page will contain the puzzle hunt gameplay interface.
          </p>
        </div>
      </div>
    </div>
  );
}
