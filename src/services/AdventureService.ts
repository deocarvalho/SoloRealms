import { Book, Entry, StartingPoint, AdventureProgress, AdventureLoader, AdventureStorage } from '@/types/adventure';

export class LocalStorageAdventureStorage implements AdventureStorage {
  private readonly STORAGE_KEY = 'adventureProgress';

  saveProgress(progress: AdventureProgress): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
  }

  loadProgress(): AdventureProgress | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  clearProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export class JsonAdventureLoader implements AdventureLoader {
  private readonly bookPath: string;

  constructor(bookPath: string) {
    this.bookPath = bookPath;
  }

  async loadBook(): Promise<Book> {
    try {
      const response = await fetch(this.bookPath);
      if (!response.ok) {
        throw new Error('Failed to load adventure book');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading adventure book:', error);
      throw error;
    }
  }

  findEntryByCode(book: Book, code: string): Entry | undefined {
    return book.Adventure.Entries.find(entry => entry.Code === code);
  }

  getStartingPoint(book: Book): StartingPoint {
    return book.Adventure.StartingPoint;
  }
}

export class AdventureService {
  constructor(
    private readonly loader: AdventureLoader,
    private readonly storage: AdventureStorage
  ) {}

  async initializeAdventure(): Promise<{ book: Book; currentEntry: Entry | StartingPoint }> {
    const book = await this.loader.loadBook();
    const savedProgress = this.storage.loadProgress();
    
    if (savedProgress?.bookId === book.Id) {
      const savedEntry = this.loader.findEntryByCode(book, savedProgress.entryCode);
      if (savedEntry) {
        return { book, currentEntry: savedEntry };
      }
    }
    
    return { book, currentEntry: this.loader.getStartingPoint(book) };
  }

  saveProgress(bookId: number, entryCode: string): void {
    this.storage.saveProgress({ bookId, entryCode });
  }

  clearProgress(): void {
    this.storage.clearProgress();
  }

  getNextEntry(book: Book, code: string): Entry | undefined {
    return this.loader.findEntryByCode(book, code);
  }
} 