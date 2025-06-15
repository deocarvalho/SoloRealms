import { BookContent, BookEntry } from '@/types/book';

export interface AdventureReaderProps {
  /** The ID of the book to read */
  bookId: number;
  /** The ID of the current user */
  userId: string;
}

export interface AdventureReaderState {
  book: BookContent | null;
  currentEntry: BookEntry | null;
  loading: boolean;
  error: string | null;
  failedImages: Set<string>;
  showConfirmModal: boolean;
} 