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
  id: string;
  text: string[];
  imageId?: string;
  choices: Choice[];
}

export interface Choice {
  text: string;
  target: string;
  requirement?: {
    type: 'spell' | 'item' | 'once' | 'feature' | 'movementType' | 'class' | 'species';
    value?: string;
  };
  visibility?: {
    startVisible?: boolean;
    states?: {
      show?: {
        when?: VisibilityCondition;
        unless?: VisibilityCondition;
      };
      hide?: {
        when?: VisibilityCondition;
        unless?: VisibilityCondition;
      };
    };
  };
}

export type VisibilityCondition = 
  | string  // Simple case: just a choice target
  | { and: VisibilityCondition[] }  // All conditions must be true
  | { or: VisibilityCondition[] }   // Any condition must be true
  | { not: VisibilityCondition };   // Condition must be false

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
    targetId: string;
    timestamp: string;
  }[];
  completedAt?: string;
}

export interface Requirement {
  type: 'once' | 'spell' | 'item' | 'class' | 'feature' | 'movementType' | 'species';
  value: string;
  entryId?: string;  // Added for once requirements
  hides?: string[];
  shows?: string[];
} 