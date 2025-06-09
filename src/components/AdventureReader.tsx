'use client';

import { useState, useEffect } from 'react';
import { BookContent, BookEntry } from '@/types/book';
import { ProgressTracker } from '@/services/ProgressTracker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Modal from '@/components/Modal';

interface AdventureReaderProps {
  bookId: number;
  userId: string;
}

export default function AdventureReader({ bookId, userId }: AdventureReaderProps) {
  const [book, setBook] = useState<BookContent | null>(null);
  const [currentEntry, setCurrentEntry] = useState<BookEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const progressTracker = new ProgressTracker(userId);

  useEffect(() => {
    async function initializeAdventure() {
      try {
        const res = await fetch(`/api/books/${bookId}/content`);
        if (!res.ok) throw new Error('Failed to load book content');
        const loadedBook = await res.json();
        setBook(loadedBook);

        // Load progress
        const progress = await progressTracker.getProgress(bookId);

        // Set initial entry
        const entryId = progress?.currentEntryId || 'START';
        const entry = loadedBook.entries.entries[entryId];

        if (!entry) {
          throw new Error(`Entry ${entryId} not found`);
        }

        setCurrentEntry(entry);
      } catch (err) {
        console.error('Error initializing adventure:', err);
        setError('Failed to load the adventure book');
      } finally {
        setLoading(false);
      }
    }

    initializeAdventure();
  }, [bookId, userId]);

  const handleChoice = async (target: string, description: string) => {
    if (!book) return;
    
    const nextEntry = book.entries.entries[target];
    if (nextEntry) {
      setCurrentEntry(nextEntry);
      // Check if this is the end of the book (no more next steps)
      const isEnd = nextEntry.nextSteps.length === 0;
      await progressTracker.updateProgress(bookId, target, description, isEnd);
    }
  };

  const handleRestart = async () => {
    if (!book) return;
    
    const startEntry = book.entries.entries['START'];
    if (startEntry) {
      // First clear the progress
      await progressTracker.clearProgress(bookId);
      
      // Then set the current entry
      setCurrentEntry(startEntry);
      
      // Finally create new progress
      await progressTracker.updateProgress(bookId, 'START', 'Restarted adventure');
    }
  };

  const handleCloseBook = async () => {
    // If we're at an endpoint (no next steps), clear the progress
    if (currentEntry && currentEntry.nextSteps.length === 0) {
      await progressTracker.clearProgress(bookId);
    }
    // Navigate back to the book list
    window.location.href = '/';
  };

  const handleImageError = (imageId: string) => {
    setFailedImages(prev => new Set(Array.from(prev).concat(imageId)));
  };

  const getImageUrl = (imageId: string | undefined): string | undefined => {
    if (!book || !imageId || failedImages.has(imageId)) return undefined;
    const image = book.images.images[imageId];
    if (!image) return undefined;
    
    return `/books/book-${bookId.toString().padStart(8, '0')}/images/${image.filename}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading adventure...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!currentEntry || !book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No entry found</div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-secondary p-6 rounded-lg shadow-lg mb-6">
            {currentEntry.imageId && (
              <div className="flex justify-center items-center my-6">
                <img 
                  src={getImageUrl(currentEntry.imageId)} 
                  alt={book.images.images[currentEntry.imageId]?.altText || 'Scene illustration'} 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  onError={() => handleImageError(currentEntry.imageId!)}
                  loading="lazy"
                />
              </div>
            )}

            {currentEntry.text.map((paragraph: string, index: number) => (
              <div key={index} className="mb-4 text-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{paragraph}</ReactMarkdown>
              </div>
            ))}

            <div className="mt-8 space-y-4">
              {currentEntry.nextSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(step.target, step.description)}
                  className="w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-left"
                >
                  {step.description}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Restart
            </button>
            <button
              onClick={handleCloseBook}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Close Book
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          handleRestart();
          setShowConfirmModal(false);
        }}
        title="Restart Adventure"
        message="Are you sure you want to restart? Your current progress will be lost."
        confirmText="Restart"
        cancelText="Cancel"
      />
    </>
  );
} 