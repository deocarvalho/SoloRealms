import { BookContentLoader } from '@/services/BookContentLoader';
import { notFound } from 'next/navigation';

interface BookPageProps {
  params: { id: string };
}

export default async function BookPage({ params }: BookPageProps) {
  const bookId = parseInt(params.id, 10);
  const loader = new BookContentLoader('/books', '/books');

  console.log('BookPage: params.id =', params.id);
  console.log('BookPage: bookId =', bookId);

  let metadata;
  try {
    // Log the path being loaded
    const path = `/books/book-${bookId.toString().padStart(8, '0')}/metadata.json`;
    console.log('BookPage: loading metadata from', path);
    metadata = await loader.loadMetadata(bookId);
    console.log('BookPage: loaded metadata:', metadata);
  } catch (error) {
    console.error('BookPage: error loading metadata:', error);
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{metadata.title}</h1>
      <p className="mb-2">By {metadata.authors.join(', ')}</p>
      {/* TODO: Add adventure reader and more book details here */}
    </div>
  );
} 