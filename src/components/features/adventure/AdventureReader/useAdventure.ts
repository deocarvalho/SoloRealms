import { useState, useEffect } from 'react';
import { BookContent, BookEntry } from '@/types/book';
import { ProgressTracker } from '@/services/ProgressTracker';
import { AdventureReaderState } from './AdventureReader.types';

interface UseAdventureProps {
  bookId: number;
  userId: string;
}

export function useAdventure({ bookId, userId }: UseAdventureProps) {
  const [state, setState] = useState<AdventureReaderState>({
    book: null,
    currentEntry: null,
    loading: true,
    error: null,
    failedImages: new Set(),
    showConfirmModal: false
  });
  
  const progressTracker = new ProgressTracker(userId);

  useEffect(() => {
    initializeAdventure();
  }, [bookId, userId]);

  const initializeAdventure = async () => {
    try {
      const res = await fetch(`/api/books/${bookId}/content`);
      if (!res.ok) throw new Error('Failed to load book content');
      const loadedBook = await res.json();

      const progress = await progressTracker.getProgress(bookId);
      const entryId = progress?.currentEntryId || 'START';
      const entry = loadedBook.entries.entries[entryId];

      if (!entry) {
        throw new Error(`Entry ${entryId} not found`);
      }

      setState(prev => ({
        ...prev,
        book: loadedBook,
        currentEntry: entry,
        loading: false
      }));
    } catch (err) {
      console.error('Error initializing adventure:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to load the adventure book',
        loading: false
      }));
    }
  };

  const handleChoice = async (target: string, text: string) => {
    if (!state.book) return;
    
    const nextEntry = state.book.entries.entries[target];
    if (nextEntry) {
      setState(prev => ({ ...prev, currentEntry: nextEntry }));
      const isEnd = nextEntry.choices.length === 0;
      await progressTracker.updateProgress(bookId, target, text, isEnd);
    }
  };

  const handleRestart = async () => {
    if (!state.book) return;
    
    const startEntry = state.book.entries.entries['START'];
    if (startEntry) {
      await progressTracker.clearProgress(bookId);
      setState(prev => ({ ...prev, currentEntry: startEntry }));
      await progressTracker.updateProgress(bookId, 'START', 'Restarted adventure');
    }
  };

  const handleCloseBook = async () => {
    if (state.currentEntry && state.currentEntry.choices.length === 0) {
      await progressTracker.clearProgress(bookId);
    }
    window.location.href = '/';
  };

  const handleImageError = (imageId: string) => {
    setState(prev => ({
      ...prev,
      failedImages: new Set(Array.from(prev.failedImages).concat(imageId))
    }));
  };

  const getImageUrl = (imageId: string | undefined): string | undefined => {
    if (!state.book || !imageId || state.failedImages.has(imageId)) return undefined;
    const image = state.book.images.images[imageId];
    if (!image) return undefined;
    
    return `/books/book-${bookId.toString().padStart(8, '0')}/images/${image.filename}`;
  };

  const setShowConfirmModal = (show: boolean) => {
    setState(prev => ({ ...prev, showConfirmModal: show }));
  };

  return {
    state,
    handleChoice,
    handleRestart,
    handleCloseBook,
    handleImageError,
    getImageUrl,
    setShowConfirmModal
  };
} 