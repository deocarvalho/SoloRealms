import { BookContent, BookMetadata, BookEntries, BookImages } from '@/types/book';
import { Book, Entry, StartingPoint, AdventureLoader } from '@/types/adventure';
import fs from 'fs/promises';
import path from 'path';

export class BookContentLoader implements AdventureLoader {
  constructor(
    private readonly booksPath: string,
    private readonly publicImagesPath: string
  ) {}

  private getAbsolutePath(...parts: string[]): string {
    return path.join(process.cwd(), ...parts);
  }

  private getBookPath(bookId: number): string {
    return path.join(this.booksPath, `book-${bookId.toString().padStart(8, '0')}`);
  }

  private getPublicImagesPath(bookId: number): string {
    return `${this.publicImagesPath}/book-${bookId.toString().padStart(8, '0')}/images`;
  }

  async loadBook(bookId: number): Promise<Book> {
    const bookPath = this.getBookPath(bookId);
    const [metadata, entries, images] = await Promise.all([
      this.loadMetadata(bookId),
      this.loadEntries(bookId),
      this.loadImages(bookId)
    ]);

    // Convert BookContent to Book format
    return {
      Id: bookId,
      Title: metadata.title,
      Authors: metadata.authors,
      Credits: metadata.credits,
      Images: Object.entries(images.images).map(([id, image]) => ({
        Code: parseInt(id),
        Image: image.filename
      })),
      Adventure: {
        StartingPoint: {
          Code: 'START',
          Text: entries.entries['START'].text,
          NextSteps: entries.entries['START'].nextSteps.map(step => ({
            Description: step.description,
            Code: step.target
          })),
          ImageCode: entries.entries['START'].imageId ? parseInt(entries.entries['START'].imageId) : undefined
        },
        Entries: Object.entries(entries.entries)
          .filter(([code]) => code !== 'START')
          .map(([code, entry]) => ({
            Code: code,
            Text: entry.text,
            NextSteps: entry.nextSteps.map(step => ({
              Description: step.description,
              Code: step.target
            })),
            ImageCode: entry.imageId ? parseInt(entry.imageId) : undefined
          }))
      }
    };
  }

  async loadMetadata(bookId: number): Promise<BookMetadata> {
    const absPath = this.getAbsolutePath(this.getBookPath(bookId), 'metadata.json');
    const data = await fs.readFile(absPath, 'utf-8');
    return JSON.parse(data);
  }

  async loadEntries(bookId: number): Promise<BookEntries> {
    const absPath = this.getAbsolutePath(this.getBookPath(bookId), 'content', 'entries.json');
    const data = await fs.readFile(absPath, 'utf-8');
    return JSON.parse(data);
  }

  async loadImages(bookId: number): Promise<BookImages> {
    const absPath = this.getAbsolutePath(this.getBookPath(bookId), 'content', 'images.json');
    const data = await fs.readFile(absPath, 'utf-8');
    return JSON.parse(data);
  }

  getImageUrl(bookId: number, filename: string): string {
    return `${this.getPublicImagesPath(bookId)}/${filename}`;
  }

  findEntryByCode(book: Book, code: string): Entry | undefined {
    return book.Adventure.Entries.find(entry => entry.Code === code);
  }

  getStartingPoint(book: Book): StartingPoint {
    return book.Adventure.StartingPoint;
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