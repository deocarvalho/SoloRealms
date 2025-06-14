'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookContent, BookEntry, Choice, Requirement } from '@/types/book';
import { ProgressTracker } from '@/services/ProgressTracker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Modal from '@/components/Modal';
import { RequirementEvaluator } from '@/services/RequirementEvaluator';
import { VisibilityManager } from '@/services/VisibilityManager';
import { BookContentLoader } from '@/services/BookContentLoader';

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
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(new Set());
  const [visibleEntries, setVisibleEntries] = useState<Set<string>>(new Set());
  const [availableChoices, setAvailableChoices] = useState<Choice[]>([]);
  const [progressTracker] = useState(() => new ProgressTracker(userId));
  const [requirementEvaluator] = useState(() => new RequirementEvaluator(progressTracker, bookId));
  const [visibilityManager] = useState(() => new VisibilityManager());
  const [bookContentLoader] = useState(() => new BookContentLoader());

  useEffect(() => {
    async function loadBook() {
      if (!bookId || !userId) return;
      
      try {
        setLoading(true);
        setError(null);
        const loadedBook = await bookContentLoader.loadBook(bookId);
        setBook(loadedBook);
        
        // Load progress and initialize visited entries
        const progress = await progressTracker.getProgress(bookId);
        if (progress) {
          setCurrentEntry(loadedBook.entries.entries[progress.currentEntryId]);
          visibilityManager.initializeVisitedEntries(progress.visitedEntries || []);
          
          // Update visibility states based on the last chosen target
          if (progress.choices && progress.choices.length > 0) {
            const lastChoice = progress.choices[progress.choices.length - 1];
            const currentEntry = loadedBook.entries.entries[progress.currentEntryId];
            await Promise.all(currentEntry.choices.map(choice => 
              visibilityManager.evaluateVisibility(choice, lastChoice.targetId)
            ));
          }
        } else {
          // Use the first entry as the starting point if no progress exists
          const firstEntryId = Object.keys(loadedBook.entries.entries)[0];
          setCurrentEntry(loadedBook.entries.entries[firstEntryId]);
        }
      } catch (error) {
        console.error('Error loading book:', error);
        setError(error instanceof Error ? error.message : 'Failed to load book');
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [bookId, userId]);

  useEffect(() => {
    async function updateAvailableChoices() {
      if (!currentEntry) {
        setAvailableChoices([]);
        return;
      }

      const choices = await Promise.all(
        currentEntry.choices.map(async (choice) => {
          // Check requirements
          if (choice.requirement) {
            const requirement: Requirement = {
              type: choice.requirement.type,
              value: choice.requirement.value || ''
            };
            const result = await requirementEvaluator.evaluateRequirement(requirement);
            if (!result.isMet) {
              return null;
            }
            // Update hidden/visible entries based on requirement result
            if (result.hiddenEntries) {
              setHiddenEntries(prev => new Set([...Array.from(prev), ...result.hiddenEntries!]));
            }
            if (result.visibleEntries) {
              setVisibleEntries(prev => new Set([...Array.from(prev), ...result.visibleEntries!]));
            }
          }

          // Check visibility
          const isVisible = await visibilityManager.evaluateVisibility(choice, currentEntry.id);
          if (!isVisible) {
            return null;
          }

          return choice;
        })
      );

      setAvailableChoices(choices.filter((choice): choice is Choice => choice !== null));
    }

    updateAvailableChoices();
  }, [currentEntry, requirementEvaluator, visibilityManager]);

  const handleChoice = async (target: string, text: string) => {
    if (!book || !currentEntry) return;

    const nextEntry = book.entries.entries[target];
    if (nextEntry) {
      if (hiddenEntries.has(target) && !visibleEntries.has(target)) {
        return;
      }

      // Update visibility states based on the chosen choice
      const chosenChoice = currentEntry.choices.find(c => c.target === target);
      if (chosenChoice) {
        await visibilityManager.evaluateVisibility(chosenChoice, currentEntry.id);
      }

      // Add the current entry to visited entries
      visibilityManager.addVisitedEntry(currentEntry.id);

      setCurrentEntry(nextEntry);
      const isEnd = nextEntry.choices.length === 0;
      await progressTracker.updateProgress(bookId, currentEntry.id, target, isEnd);
    }
  };

  const handleRestart = async () => {
    if (!book) return;

    // Use the first entry as the starting point
    const firstEntryId = Object.keys(book.entries.entries)[0];
    const startEntry = book.entries.entries[firstEntryId];
    if (startEntry) {
      // First clear the progress
      await progressTracker.clearProgress(bookId);

      // Reset visibility state
      visibilityManager.resetState();
      setHiddenEntries(new Set());
      setVisibleEntries(new Set());

      // Then set the current entry
      setCurrentEntry(startEntry);

      // Finally create new progress
      await progressTracker.updateProgress(bookId, firstEntryId, firstEntryId, false);
    }
  };

  const handleCloseBook = async () => {
    if (currentEntry) {
      // If we're at an endpoint (no more choices), clear the progress
      if (currentEntry.choices.length === 0) {
        await progressTracker.clearProgress(bookId);
      } else {
        // Otherwise, save the current progress
        await progressTracker.updateProgress(bookId, currentEntry.id, currentEntry.id);
      }
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
              {availableChoices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(choice.target, choice.text)}
                  className="w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-left"
                >
                  {choice.text}
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