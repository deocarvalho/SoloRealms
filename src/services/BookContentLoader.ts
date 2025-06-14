import { BookContent } from '@/types/book';

export class BookContentLoader {
  async loadBook(bookId: number): Promise<BookContent> {
    const response = await fetch(`/api/books/${bookId}/content`);
    if (!response.ok) {
      throw new Error('Failed to load book content');
    }
    return response.json();
  }

  getImageUrl(bookId: number, filename: string): string {
    return `/books/book-${bookId.toString().padStart(8, '0')}/images/${filename}`;
  }

  getThumbnailUrl(bookId: number, filename: string): string {
    if (filename.includes('-thumb')) {
      return this.getImageUrl(bookId, filename);
    }
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return this.getImageUrl(bookId, filename);
    }
    const baseName = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex);
    return this.getImageUrl(bookId, `${baseName}-thumb${extension}`);
  }
} 