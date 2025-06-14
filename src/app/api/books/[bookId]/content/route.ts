import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request, { params }: { params: { bookId: string } }) {
  try {
    const bookId = parseInt(params.bookId);
    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: 'Invalid book ID' },
        { status: 400 }
      );
    }

    const bookPath = path.join(process.cwd(), 'books', `book-${bookId.toString().padStart(8, '0')}`);
    
    // Check if book directory exists
    try {
      await fs.access(bookPath);
    } catch {
      return NextResponse.json(
        { error: `Book ${bookId} not found` },
        { status: 404 }
      );
    }

    // Load metadata, entries, and images
    try {
      const [metadata, entries, images] = await Promise.all([
        fs.readFile(path.join(bookPath, 'metadata.json'), 'utf-8'),
        fs.readFile(path.join(bookPath, 'content', 'entries.json'), 'utf-8'),
        fs.readFile(path.join(bookPath, 'content', 'images.json'), 'utf-8')
      ]);

      return NextResponse.json({
        metadata: JSON.parse(metadata),
        entries: JSON.parse(entries),
        images: JSON.parse(images)
      });
    } catch (error) {
      console.error('Error reading book files:', error);
      return NextResponse.json(
        { error: 'Failed to read book files' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error loading book content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 