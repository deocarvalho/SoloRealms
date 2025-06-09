"use client";
import { useState, useEffect } from 'react';
import { BookMetadata } from '@/types/book';
import AdventureReader from '@/components/AdventureReader';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { ProgressTracker } from '@/services/ProgressTracker';
import Modal from '@/components/Modal';

interface BookListClientProps {
  books: BookMetadata[];
}

export default function BookListClient({ books }: BookListClientProps) {
  const [showAdventure, setShowAdventure] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [ongoingSessions, setOngoingSessions] = useState<{ [bookId: number]: { description: string, currentEntryId: string } }>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBookId, setPendingBookId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get or create anonymous user ID
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = 'anon_' + Math.random().toString(36).substring(2);
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);

    // Load books
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        // After books are loaded, load ongoing sessions
        return loadOngoingSessions(storedUserId);
      })
      .catch(error => {
        console.error('Error loading books:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const loadOngoingSessions = async (userId: string) => {
    const progressTracker = new ProgressTracker(userId);
    const sessions: { [bookId: number]: { description: string, currentEntryId: string } } = {};
    
    // Load progress for each book
    for (const book of books) {
      const progress = await progressTracker.getProgress(book.id);
      if (progress) {
        let description = '';
        if (progress.choices && progress.choices.length > 0) {
          description = progress.choices[progress.choices.length - 1].choice;
        } else {
          description = `At entry ${progress.currentEntryId}`;
        }
        sessions[book.id] = {
          description,
          currentEntryId: progress.currentEntryId
        };
      }
    }
    
    setOngoingSessions(sessions);
  };

  const handleImageError = (imageId: string) => {
    setFailedImages(prev => new Set(Array.from(prev).concat(imageId)));
  };

  const handleStartNewGame = async (bookId: number) => {
    const progressTracker = new ProgressTracker(userId);
    await progressTracker.clearProgress(bookId);
    setSelectedBookId(bookId);
    setShowAdventure(true);
  };

  const handleNewGameClick = (bookId: number) => {
    setPendingBookId(bookId);
    setShowConfirmModal(true);
  };

  const handleConfirmNewGame = async () => {
    if (pendingBookId !== null) {
      await handleStartNewGame(pendingBookId);
      setShowConfirmModal(false);
      setPendingBookId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mx-auto mb-4"></div>
          <div className="text-xl">Loading your adventures...</div>
        </div>
      </div>
    );
  }

  if (showAdventure && selectedBookId !== null && userId) {
    return <AdventureReader bookId={selectedBookId} userId={userId} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => {
          const session = ongoingSessions[book.id];
          const hasOngoingSession = !!session;
          const coverImage = book.coverImage?.thumb;
          const shouldShowImage = coverImage && !failedImages.has(coverImage.id);
          const coverImageUrl = coverImage ? `/books/book-${book.id.toString().padStart(8, '0')}/images/${coverImage.filename}` : '';
          return (
            <div key={book.id} className="bg-white/10 rounded-lg shadow-lg overflow-hidden border border-white/20 flex flex-col h-full">
              <div className="relative h-48 bg-gray-100 p-6 m-2">
                {shouldShowImage ? (
                  <Image
                    src={coverImageUrl}
                    alt={coverImage.altText || book.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                    onError={() => handleImageError(coverImage.id)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <span>No cover image</span>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-2xl font-bold mb-2 text-white drop-shadow">{book.title}</h2>
                <p className="text-gray-300 mb-4">By {book.authors?.join(', ')}</p>
                <div className="mt-auto">
                  {hasOngoingSession ? (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setSelectedBookId(book.id);
                          setShowAdventure(true);
                        }}
                        className="flex-1 bg-accent text-white px-4 py-2 rounded hover:bg-accent-dark transition-colors font-semibold shadow"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => handleNewGameClick(book.id)}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors font-semibold shadow"
                      >
                        Restart
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedBookId(book.id);
                        setShowAdventure(true);
                      }}
                      className="w-full bg-accent text-white px-6 py-2 rounded hover:bg-accent-dark transition-colors font-semibold shadow"
                    >
                      Start Adventure
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingBookId(null);
        }}
        onConfirm={handleConfirmNewGame}
        title="Start New Game"
        message="Are you sure you want to start a new game? Your current progress will be lost."
        confirmText="Start New Game"
        cancelText="Cancel"
      />
    </>
  );
} 