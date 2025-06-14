// Book metadata
export interface BookMetadata {
  id: number;
  title: string;
  authors: string[];
  credits: string[];
  version: string;
  publishedAt: string;
  status: 'draft' | 'published' | 'archived';
  coverImage: {
    full: ImageMetadata;
    thumb: ImageMetadata;
  };
}

// Book entry
export interface BookEntry {
  text: string[];
  imageId?: string;
  choices: {
    text: string;
    target: string;
  }[];
}

// Book entries collection
export interface BookEntries {
  entries: Record<string, BookEntry>;
}

// Image metadata
export interface ImageMetadata {
  id: string;
  filename: string;
  altText: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size?: number;  // File size in bytes
  };
}

// Images collection
export interface BookImages {
  images: Record<string, ImageMetadata>;
}

// Complete book content
export interface BookContent {
  metadata: BookMetadata;
  entries: BookEntries;
  images: BookImages;
}

// User progress
export interface UserProgress {
  userId: string;
  bookId: number;
  currentEntryId: string;
  visitedEntries: string[];
  choices: {
    entryId: string;
    choice: string;
    timestamp: string;
  }[];
  completedAt?: string;
} 