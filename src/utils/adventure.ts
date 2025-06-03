'use client';

import { Book } from '@/types/adventure';

export async function loadAdventureBook(): Promise<Book> {
  try {
    console.log('Attempting to load adventure book...');
    const response = await fetch('/dark-knights-squire.json');
    console.log('Fetch response status:', response.status);
    
    if (!response.ok) {
      console.error('Failed to load adventure book. Status:', response.status);
      throw new Error('Failed to load adventure book');
    }
    
    const book: Book = await response.json();
    console.log('Successfully loaded book:', book);
    return book;
  } catch (error) {
    console.error('Error loading adventure book:', error);
    throw error;
  }
}

export function findEntryByCode(book: Book, code: string) {
  console.log('Finding entry with code:', code);
  const entry = book.Adventure.Entries.find(entry => entry.Code === code);
  console.log('Found entry:', entry);
  return entry;
}

export function getStartingPoint(book: Book) {
  console.log('Getting starting point from book:', book);
  const startingPoint = book.Adventure.StartingPoint;
  console.log('Starting point:', startingPoint);
  return startingPoint;
} 