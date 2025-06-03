'use client';

import { useState } from 'react';
import AdventureReader from '@/components/AdventureReader';

export default function Home() {
  const [showAdventure, setShowAdventure] = useState(false);

  if (showAdventure) {
    return <AdventureReader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">SoloQuest</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-secondary p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">The Death Knight's Squire</h2>
          <p className="text-gray-300 mb-4">
            A solo adventure in the world of Dungeons & Dragons.
          </p>
          <button
            onClick={() => setShowAdventure(true)}
            className="bg-accent text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Start Adventure
          </button>
        </div>
      </div>
    </div>
  );
} 