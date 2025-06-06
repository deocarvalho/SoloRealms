'use client';

import { useState, useEffect } from 'react';
import { Book, Entry, NextStep } from '@/types/adventure';
import { AdventureService, JsonAdventureLoader, LocalStorageAdventureStorage } from '@/services/AdventureService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AdventureReaderProps {
  bookId: string;  // This is actually the full filename
}

export default function AdventureReader({ bookId }: AdventureReaderProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  const adventureService = new AdventureService(
    new JsonAdventureLoader(`/json_books/${bookId}`),  // Use the full filename directly
    new LocalStorageAdventureStorage()
  );

  useEffect(() => {
    async function initializeAdventure() {
      try {
        const { book: loadedBook, currentEntry: initialEntry } = await adventureService.initializeAdventure();
        setBook(loadedBook);
        setCurrentEntry(initialEntry);
      } catch (err) {
        console.error('Error initializing adventure:', err);
        setError('Failed to load the adventure book');
      } finally {
        setLoading(false);
      }
    }

    initializeAdventure();
  }, [bookId]);

  useEffect(() => {
    if (book && currentEntry) {
      adventureService.saveProgress(book.Id, currentEntry.Code);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [book, currentEntry]);

  const handleChoice = (code: string) => {
    if (!book) return;
    
    const nextEntry = adventureService.getNextEntry(book, code);
    if (nextEntry) {
      setCurrentEntry(nextEntry);
    }
  };

  const handleRestart = () => {
    if (book) {
      setCurrentEntry(book.Adventure.StartingPoint);
      adventureService.clearProgress();
    }
  };

  const handleCloseBook = () => {
    window.location.href = '/';
    adventureService.clearProgress();
  };

  const handleImageError = (imageCode: string) => {
    setFailedImages(prev => new Set(Array.from(prev).concat(imageCode)));
  };

  const getImageByCode = (code: string | undefined): string | undefined => {
    if (!book || !code || failedImages.has(code)) return undefined;
    return book.Images?.find(img => img.Code === code)?.Image;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!currentEntry) {
    return <NoEntryState />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto expand-content">
        <AdventureContent 
          entry={currentEntry}
          book={book}
          getImageByCode={getImageByCode}
          onChoice={handleChoice}
          onRestart={handleRestart}
          onClose={handleCloseBook}
          onImageError={handleImageError}
        />
      </div>
    </div>
  );
}

// Extracted components for better separation of concerns
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading adventure...</div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl text-red-500">{error}</div>
    </div>
  );
}

function NoEntryState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">No entry found</div>
    </div>
  );
}

interface AdventureContentProps {
  entry: Entry;
  book: Book | null;
  getImageByCode: (code: string | undefined) => string | undefined;
  onChoice: (code: string) => void;
  onRestart: () => void;
  onClose: () => void;
  onImageError: (code: string) => void;
}

function AdventureContent({ entry, book, getImageByCode, onChoice, onRestart, onClose, onImageError }: AdventureContentProps) {
  return (
    <>
      <div className="bg-secondary p-6 rounded-lg shadow-lg mb-6">
        {entry.ImageCode && getImageByCode(entry.ImageCode) && (
          <div className="my-6">
            <img 
              src={getImageByCode(entry.ImageCode)} 
              alt="Scene illustration" 
              className="max-w-full h-auto rounded-lg shadow-lg"
              onError={() => onImageError(entry.ImageCode!)}
            />
          </div>
        )}

        {entry.Text.map((paragraph: string, index: number) => (
          <div key={index} className="mb-4 text-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph}</ReactMarkdown>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {entry.NextSteps.length > 0 ? (
          entry.NextSteps.map((step: NextStep, index: number) => (
            <button
              key={index}
              onClick={() => onChoice(step.Code)}
              className="w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-left"
            >
              {step.Description}
            </button>
          ))
        ) : (
          <>
            <button
              onClick={onRestart}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-left"
            >
              Restart Adventure
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              Close Book
            </button>
          </>
        )}
      </div>
    </>
  );
} 