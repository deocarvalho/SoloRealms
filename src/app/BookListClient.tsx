"use client";
import { useState, useEffect } from 'react';
import { BookMetadata } from '@/types/book';
import AdventureReader from '@/components/AdventureReader';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { ProgressTracker } from '@/services/ProgressTracker';
import Modal from '@/components/Modal';
import BookCard from '@/components/BookCard';

interface BookListClientProps {
  books: BookMetadata[];
}

export default function BookListClient({ books }: BookListClientProps) {
  const [showAdventure, setShowAdventure] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [ongoingSessions, setOngoingSessions] = useState<{ [bookId: number]: { currentEntryId: string } }>({});
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

  // Add effect to reload sessions when adventure is closed
  useEffect(() => {
    if (!showAdventure && userId) {
      loadOngoingSessions(userId);
    }
  }, [showAdventure, userId]);

  const loadOngoingSessions = async (userId: string) => {
    const progressTracker = new ProgressTracker(userId);
    const sessions: { [bookId: number]: { currentEntryId: string } } = {};
    
    // Load progress for each book
    for (const book of books) {
      const progress = await progressTracker.getProgress(book.id);
      if (progress && progress.currentEntryId) {
        sessions[book.id] = {
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onStart={() => {
                setSelectedBookId(book.id);
                setShowAdventure(true);
              }}
              onContinue={() => {
                setSelectedBookId(book.id);
                setShowAdventure(true);
              }}
              onRestart={() => {
                if (window.confirm('Are you sure you want to restart this adventure? All progress will be lost.')) {
                  const progressTracker = new ProgressTracker(userId);
                  progressTracker.clearProgress(book.id);
                  loadOngoingSessions(userId);
                }
              }}
              hasProgress={!!ongoingSessions[book.id]}
            />
          ))}
        </div>
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