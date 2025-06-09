const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function importBook(bookId) {
  try {
    const bookDir = path.join(__dirname, '..', 'books', `book-${bookId.toString().padStart(8, '0')}`);
    
    // Read metadata
    const metadata = JSON.parse(fs.readFileSync(path.join(bookDir, 'metadata.json'), 'utf8'));
    console.log(`Importing book: ${metadata.title}`);

    // Read images first to get cover image
    const imagesData = JSON.parse(fs.readFileSync(path.join(bookDir, 'content', 'images.json'), 'utf8'));
    
    // Set the first image as cover image
    const firstImageId = Object.keys(imagesData.images)[0];
    const coverImage = imagesData.images[firstImageId];
    
    // Create thumbnail for cover image
    const coverImagePath = path.join(bookDir, 'images', coverImage.filename);
    const thumbImagePath = path.join(bookDir, 'images', `${firstImageId}-thumb.jpg`);
    
    try {
      await sharp(coverImagePath)
        .resize(100, 75, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 80,
          mozjpeg: true
        })
        .toFile(thumbImagePath);

      // Get thumbnail metadata
      const thumbMetadata = await sharp(thumbImagePath).metadata();

      metadata.coverImage = {
        full: coverImage,
        thumb: {
          id: `${firstImageId}-thumb`,
          filename: `${firstImageId}-thumb.jpg`,
          altText: `Cover image for ${metadata.title}`,
          metadata: {
            width: thumbMetadata.width,
            height: thumbMetadata.height,
            format: 'jpg',
            size: fs.statSync(thumbImagePath).size
          }
        }
      };
    } catch (error) {
      console.error('Failed to create cover image thumbnail:', error);
    }

    // Insert book metadata
    const { data: bookData, error: bookError } = await supabase
      .from('book_metadata')
      .upsert({
        id: metadata.id,
        title: metadata.title,
        authors: metadata.authors,
        credits: metadata.credits,
        version: metadata.version,
        published_at: metadata.publishedAt,
        status: metadata.status,
        cover_image: metadata.coverImage || null
      })
      .select();

    if (bookError) throw bookError;
    console.log('✓ Book metadata imported');

    // Read entries
    const entries = JSON.parse(fs.readFileSync(path.join(bookDir, 'content', 'entries.json'), 'utf8'));
    
    // Insert entries
    for (const [entryId, entry] of Object.entries(entries.entries)) {
      const { error: entryError } = await supabase
        .from('book_entries')
        .upsert({
          book_id: metadata.id,
          entry_id: entryId,
          text: entry.text,
          image_id: entry.imageId,
          next_steps: entry.nextSteps
        }, {
          onConflict: 'book_id,entry_id'
        });

      if (entryError) {
        console.error(`Error upserting entry ${entryId}:`, entryError);
        continue;
      }
    }
    console.log('✓ Book entries imported');

    // Insert images
    for (const [imageId, image] of Object.entries(imagesData.images)) {
      const { error: imageError } = await supabase
        .from('book_images')
        .upsert({
          book_id: metadata.id,
          image_id: imageId,
          filename: image.filename,
          alt_text: image.altText,
          metadata: image.metadata
        }, {
          onConflict: 'book_id,image_id'
        });

      if (imageError) {
        console.error(`Error upserting image ${imageId}:`, imageError);
        continue;
      }
    }
    console.log('✓ Book images imported');

    console.log('✓ Book import completed successfully');
  } catch (error) {
    console.error('Error importing book:', error);
    process.exit(1);
  }
}

// Import the first book
importBook(1); 