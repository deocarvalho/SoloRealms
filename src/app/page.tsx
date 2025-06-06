'use client';

import { useState, useEffect } from 'react';
import { Book } from '@/types/adventure';
import AdventureReader from '@/components/AdventureReader';

// Helper to load all book JSONs from public/json_books
async function loadBooks(): Promise<{ books: Book[], filenames: { [id: string]: string } }> {
  try {
    console.log('Fetching list of books...');
    // First, get the list of available books
    const response = await fetch('/api/books');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch book list:', response.status, errorData);
      throw new Error(`Failed to fetch book list: ${response.status} ${errorData.error || ''}`);
    }
    
    const { books: bookFiles } = await response.json();
    console.log('Found book files:', bookFiles);
    
    if (!bookFiles || !Array.isArray(bookFiles) || bookFiles.length === 0) {
      console.warn('No book files found');
      return { books: [], filenames: {} };
    }
    
    // Load each book in parallel
    console.log('Loading book contents...');
    const bookPromises = bookFiles.map(async (filename: string) => {
      try {
        console.log(`Loading book: ${filename}`);
        const bookResponse = await fetch(`/json_books/${filename}`);
        if (!bookResponse.ok) {
          console.error(`Failed to load book ${filename}:`, bookResponse.status);
          return null;
        }
        const book = await bookResponse.json();
        console.log(`Successfully loaded book: ${filename}`);
        return { book, filename };
      } catch (error) {
        console.error(`Error loading book ${filename}:`, error);
        return null;
      }
    });

    const loadedBooks = await Promise.all(bookPromises);
    const validBooks = loadedBooks.filter((result): result is { book: Book, filename: string } => result !== null);
    console.log(`Successfully loaded ${validBooks.length} books`);

    // Create a mapping of book IDs to filenames
    const filenames: { [id: string]: string } = {};
    validBooks.forEach(({ book, filename }) => {
      filenames[book.Id] = filename;
    });

    return { 
      books: validBooks.map(result => result.book),
      filenames 
    };
  } catch (error) {
    console.error('Error loading books:', error);
    return { books: [], filenames: {} };
  }
}

export default function Home() {
  const [showAdventure, setShowAdventure] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookFilenames, setBookFilenames] = useState<{ [id: string]: string }>({});
  const [ongoingSessions, setOngoingSessions] = useState<{ [bookId: string]: boolean }>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBooks().then(({ books: loadedBooks, filenames }) => {
      setBooks(loadedBooks);
      setBookFilenames(filenames);
      
      // Check localStorage for ongoing sessions for each book
      const sessions: { [bookId: string]: boolean } = {};
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('adventureProgress');
        if (saved) {
          try {
            const progress = JSON.parse(saved);
            loadedBooks.forEach(book => {
              if (progress.bookId === book.Id) {
                sessions[book.Id] = true;
              }
            });
          } catch {}
        }
      }
      setOngoingSessions(sessions);
    });
  }, []);

  const handleImageError = (imageCode: string) => {
    setFailedImages(prev => new Set(Array.from(prev).concat(imageCode)));
  };

  if (showAdventure && selectedBookId) {
    return <AdventureReader bookId={selectedBookId} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Solo Realms</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => {
          const coverThumb = book.Images?.find(img => img.Code === 'cover-thumb');
          const shouldShowImage = coverThumb && !failedImages.has(coverThumb.Code);
          
          return (
            <div key={book.Id} className="bg-secondary p-6 rounded-lg shadow-lg relative">
              {ongoingSessions[book.Id] && (
                <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">Ongoing Session</span>
              )}
              {shouldShowImage && (
                <img
                  src={coverThumb.Image}
                  alt="Book cover thumbnail"
                  className="mx-auto my-2 max-h-40 w-auto object-contain rounded shadow"
                  onError={() => handleImageError(coverThumb.Code)}
                />
              )}
              <h2 className="text-2xl font-semibold mb-4">{book.Title}</h2>
              <button
                onClick={() => {
                  setSelectedBookId(bookFilenames[book.Id]);
                  setShowAdventure(true);
                }}
                className="bg-accent text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Start Adventure
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
} 