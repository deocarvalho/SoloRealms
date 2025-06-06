import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const booksDirectory = path.join(process.cwd(), 'public', 'json_books');
    console.log('Reading books from directory:', booksDirectory);
    
    if (!fs.existsSync(booksDirectory)) {
      console.error('Books directory does not exist:', booksDirectory);
      return NextResponse.json(
        { error: 'Books directory not found' },
        { status: 404 }
      );
    }

    const files = fs.readdirSync(booksDirectory);
    console.log('Found files:', files);
    
    // Filter for JSON files and exclude template.json
    const bookFiles = files.filter(file => 
      file.endsWith('.json') //&& file !== 'template.json'
    );
    console.log('Filtered book files:', bookFiles);

    return NextResponse.json({ books: bookFiles });
  } catch (error) {
    console.error('Error reading books directory:', error);
    return NextResponse.json(
      { error: 'Failed to load books', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 