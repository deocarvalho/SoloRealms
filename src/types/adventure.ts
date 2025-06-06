// Base interface for common properties
export interface BaseEntry {
  Code: string;
  Text: string[];
  NextSteps: NextStep[];
}

export interface NextStep {
  Description: string;
  Code: string;
}

export interface Entry extends BaseEntry {
  ImageCode?: string;
}

export interface StartingPoint extends BaseEntry {}

export interface Adventure {
  StartingPoint: StartingPoint;
  Entries: Entry[];
}

export interface Image {
  Code: string;
  Image: string;
}

export interface Book {
  Id: string;
  Title: string;
  Authors: string[];
  Credits: string[];
  Images: Image[];
  Adventure: Adventure;
}

// New interfaces for better separation of concerns
export interface AdventureProgress {
  bookId: string;
  entryCode: string;
}

export interface AdventureStorage {
  saveProgress(progress: AdventureProgress): void;
  loadProgress(): AdventureProgress | null;
  clearProgress(): void;
}

export interface AdventureLoader {
  loadBook(): Promise<Book>;
  findEntryByCode(book: Book, code: string): Entry | undefined;
  getStartingPoint(book: Book): StartingPoint;
} 