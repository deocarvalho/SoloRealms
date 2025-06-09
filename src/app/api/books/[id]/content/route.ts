import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const bookId = parseInt(params.id, 10);
  const bookDir = path.join(process.cwd(), 'books', `book-${bookId.toString().padStart(8, '0')}`);
  try {
    const metadata = JSON.parse(await fs.readFile(path.join(bookDir, 'metadata.json'), 'utf-8'));
    const entries = JSON.parse(await fs.readFile(path.join(bookDir, 'content', 'entries.json'), 'utf-8'));
    const images = JSON.parse(await fs.readFile(path.join(bookDir, 'content', 'images.json'), 'utf-8'));
    return NextResponse.json({ metadata, entries, images });
  } catch (error) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }
} 