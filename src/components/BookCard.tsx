import { BookMetadata } from '@/types/book';
import Image from 'next/image';
import { useState } from 'react';

interface BookCardProps {
  book: BookMetadata;
  onStart: () => void;
  onContinue: () => void;
  onRestart: () => void;
  hasProgress: boolean;
}

export default function BookCard({ book, onStart, onContinue, onRestart, hasProgress }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const coverImage = book.coverImage?.thumb;
  const shouldShowImage = coverImage && !imageError;
  const coverImageUrl = coverImage ? `/books/book-${book.id.toString().padStart(8, '0')}/images/${coverImage.filename}` : '';

  return (
    <div className="bg-white/10 rounded-lg shadow-lg overflow-hidden border border-white/20 flex flex-col h-full">
      <div className="relative h-48 bg-gray-100 p-6 m-2">
        {shouldShowImage ? (
          <Image
            src={coverImageUrl}
            alt={coverImage.altText || book.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority
            onError={() => setImageError(true)}
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
        <div className="mt-auto flex space-x-4">
          {hasProgress ? (
            <div className="flex space-x-4 w-full">
              <button
                onClick={onContinue}
                className="flex-1 bg-accent text-white px-4 py-2 rounded hover:bg-accent-dark transition-colors font-semibold shadow"
              >
                Continue
              </button>
              <button
                onClick={onRestart}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors font-semibold shadow"
              >
                Restart
              </button>
            </div>
          ) : (
            <button
              onClick={onStart}
              className="w-full bg-accent text-white px-6 py-2 rounded hover:bg-accent-dark transition-colors font-semibold shadow"
            >
              Start Adventure
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 