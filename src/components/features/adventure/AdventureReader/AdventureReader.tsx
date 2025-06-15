'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Modal } from '@/components/common/Modal';
import { AdventureReaderProps } from './AdventureReader.types';
import { useAdventure } from './useAdventure';

/**
 * AdventureReader component for displaying and interacting with adventure books.
 * Handles book content loading, progress tracking, and user choices.
 */
export function AdventureReader({ bookId, userId }: AdventureReaderProps) {
  const {
    state,
    handleChoice,
    handleRestart,
    handleCloseBook,
    handleImageError,
    getImageUrl,
    setShowConfirmModal
  } = useAdventure({ bookId, userId });

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading adventure...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{state.error}</div>
      </div>
    );
  }

  if (!state.currentEntry || !state.book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No entry found</div>
      </div>
    );
  }

  const { currentEntry, book } = state;

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
              {currentEntry.choices.map((choice, index) => (
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
        isOpen={state.showConfirmModal}
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