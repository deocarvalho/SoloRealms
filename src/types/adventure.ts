// Base interface for common properties
export interface BaseEntry {
  Code: string;
  Text: string[];
  NextSteps: NextStep[];
}

export type RequirementType = 'spell' | 'item' | 'once' | 'feature' | 'movementType' | 'class' | 'species';

export interface Requirement {
  type: RequirementType;
  value?: string;
  hides?: string[];  // Array of entry codes to hide when requirement is met
  shows?: string[];  // Array of entry codes to show when requirement is met
}

export interface NextStep {
  Description: string;
  Code: string;
  requirement?: Requirement;
}

export interface Entry extends BaseEntry {
  ImageCode?: number;
}

export interface StartingPoint extends Entry {}

export interface Adventure {
  StartingPoint: StartingPoint;
  Entries: Entry[];
}

export interface Image {
  Code: number;
  Image: string;
}

export interface Book {
  Id: number;
  Title: string;
  Authors: string[];
  Credits: string[];
  Images: Image[];
  Adventure: Adventure;
}

// New interfaces for better separation of concerns
export interface AdventureProgress {
  bookId: number;
  entryCode: string;
}

export interface AdventureStorage {
  saveProgress(progress: AdventureProgress): void;
  loadProgress(): AdventureProgress | null;
  clearProgress(): void;
}

export interface AdventureLoader {
  loadBook(bookId: number): Promise<Book>;
  findEntryByCode(book: Book, code: string): Entry | undefined;
  getStartingPoint(book: Book): StartingPoint;
} 