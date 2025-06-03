'use client';

import { useState, useEffect } from 'react';
import { Book, Entry, NextStep } from '@/types/adventure';
import { loadAdventureBook, findEntryByCode, getStartingPoint } from '@/utils/adventure';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AdventureReader() {
  const [book, setBook] = useState<Book | null>(null);
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('AdventureReader mounted');
    async function loadBook() {
      try {
        console.log('Starting to load book...');
        const loadedBook = await loadAdventureBook();
        console.log('Book loaded successfully:', loadedBook);
        setBook(loadedBook);
        
        const startingPoint = getStartingPoint(loadedBook);
        console.log('Got starting point:', startingPoint);
        setCurrentEntry(startingPoint);
      } catch (err) {
        console.error('Error in loadBook:', err);
        setError('Failed to load the adventure book');
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, []);

  useEffect(() => {
    if (currentEntry) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentEntry]);

  const handleChoice = (code: string) => {
    console.log('Handling choice with code:', code);
    if (!book) {
      console.error('No book available for choice');
      return;
    }
    const nextEntry = findEntryByCode(book, code);
    console.log('Next entry found:', nextEntry);
    if (nextEntry) {
      setCurrentEntry(nextEntry);
    }
  };

  const handleRestart = () => {
    if (book) {
      const startingPoint = getStartingPoint(book);
      setCurrentEntry(startingPoint);
    }
  };

  const handleCloseBook = () => {
    window.location.href = '/';
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading adventure...</div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (!currentEntry) {
    console.log('No current entry available');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No entry found</div>
      </div>
    );
  }

  console.log('Rendering main content with entry:', currentEntry);
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto expand-content">
        <div className="bg-secondary p-6 rounded-lg shadow-lg mb-6">
          {currentEntry.Text.map((paragraph: string, index: number) => {
            console.log('Rendering paragraph:', paragraph);
            return (
              <div key={index} className="mb-4 text-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph}</ReactMarkdown>
              </div>
            );
          })}

          {currentEntry?.image && (
            <div className="my-6">
              <img 
                src={currentEntry.image} 
                alt="Scene illustration" 
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {currentEntry.NextSteps.length > 0 ? (
            currentEntry.NextSteps.map((step: NextStep, index: number) => (
              <button
                key={index}
                onClick={() => handleChoice(step.Code)}
                className="w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-left"
              >
                {step.Description}
              </button>
            ))
          ) : (
            <>
              <button
                onClick={handleRestart}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-left"
              >
                Restart Adventure
              </button>
              <button
                onClick={handleCloseBook}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                Close Book
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 