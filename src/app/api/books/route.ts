import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BookMetadata } from '@/types/book';

export async function GET() {
  try {
    const booksDirectory = path.join(process.cwd(), 'books');
    console.log('Reading books from directory:', booksDirectory);
    
    if (!fs.existsSync(booksDirectory)) {
      console.error('Books directory does not exist:', booksDirectory);
      return NextResponse.json(
        { error: 'Books directory not found' },
        { status: 404 }
      );
    }

    const bookFolders = fs.readdirSync(booksDirectory)
      .filter(folder => folder.startsWith('book-'))
      .sort();

    console.log('Found book folders:', bookFolders);
    
    const books: BookMetadata[] = [];
    
    for (const folder of bookFolders) {
      try {
        const metadataPath = path.join(booksDirectory, folder, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as BookMetadata;
          books.push(metadata);
        }
      } catch (error) {
        console.error(`Error reading metadata for ${folder}:`, error);
      }
    }

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error reading books directory:', error);
    return NextResponse.json(
      { error: 'Failed to load books', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 