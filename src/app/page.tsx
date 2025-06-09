import { BookContentLoader } from '@/services/BookContentLoader';
import { BookMetadata } from '@/types/book';
import BookListClient from './BookListClient';
import { Cinzel_Decorative } from 'next/font/google';

const cinzelDecorative = Cinzel_Decorative({ 
  weight: '700',
  subsets: ['latin']
});

export default async function Home() {
  const loader = new BookContentLoader('/books', '/books');
  // Read all book folders
  const fs = require('fs');
  const path = require('path');
  const booksDirectory = path.join(process.cwd(), 'books');
  const bookFolders = fs.readdirSync(booksDirectory).filter((folder: string) => folder.startsWith('book-')).sort();
  const books: BookMetadata[] = [];
  for (const folder of bookFolders) {
    try {
      const metadataPath = path.join(booksDirectory, folder, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as BookMetadata;
        books.push(metadata);
      }
    } catch (error) {
      // skip
    }
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-4xl font-bold mb-8 ${cinzelDecorative.className}`}>Solo Realms</h1>
      <BookListClient books={books} />
    </div>
  );
} 