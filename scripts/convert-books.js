const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const SOURCE_DIR = path.join(__dirname, '..', 'public', 'json_books');
const TARGET_DIR = path.join(__dirname, '..', 'books');
const IMAGE_QUALITY = 80;
const THUMB_WIDTH = 100;
const THUMB_HEIGHT = 75;

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function extractBase64Data(dataUrl) {
  // Check if it's a data URL
  if (typeof dataUrl !== 'string') {
    throw new Error('Invalid image data: not a string');
  }

  // If it's already a base64 string without data URL prefix
  if (dataUrl.match(/^[A-Za-z0-9+/=]+$/)) {
    return dataUrl;
  }

  // Extract base64 data from data URL
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data: not a valid data URL or base64 string');
  }

  return matches[2];
}

async function processImage(imageData, bookId, imageId, isCover = false) {
  try {
    // Extract base64 data from data URL if needed
    const base64Data = extractBase64Data(imageData);
    
    // Create images directory if it doesn't exist
    const imagesDir = path.join(TARGET_DIR, `book-${bookId.toString().padStart(8, '0')}`, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Try to detect image format
    let inputMetadata;
    try {
      inputMetadata = await sharp(imageBuffer).metadata();
      console.log(`Processing ${imageId} (${inputMetadata.format} ${inputMetadata.width}x${inputMetadata.height})`);
    } catch (error) {
      console.error(`Failed to detect image format for ${imageId}. Base64 length: ${base64Data.length}`);
      throw new Error(`Invalid image data for ${imageId}: ${error.message}`);
    }
    
    // Process full image
    const fullImagePath = path.join(imagesDir, `${imageId}.jpg`);
    try {
      await sharp(imageBuffer)
        .jpeg({ 
          quality: IMAGE_QUALITY,
          mozjpeg: true // Better compression
        })
        .toFile(fullImagePath);
    } catch (error) {
      console.error(`Failed to convert image ${imageId} to JPEG. Error: ${error.message}`);
      throw error;
    }

    // Get output image metadata
    const metadata = await sharp(fullImagePath).metadata();
    
    const result = {
      id: `${imageId}-full`,
      filename: `${imageId}.jpg`,
      altText: `Scene illustration for ${imageId}`,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: 'jpg',
        size: fs.statSync(fullImagePath).size
      }
    };

    // Only create thumbnail for cover images
    if (isCover) {
      const thumbImagePath = path.join(imagesDir, `${imageId}-thumb.jpg`);
      try {
        await sharp(imageBuffer)
          .resize(THUMB_WIDTH, THUMB_HEIGHT, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: IMAGE_QUALITY,
            mozjpeg: true // Better compression
          })
          .toFile(thumbImagePath);
      } catch (error) {
        console.error(`Failed to create thumbnail for ${imageId}. Error: ${error.message}`);
        throw error;
      }

      // Get thumbnail metadata
      const thumbMetadata = await sharp(thumbImagePath).metadata();

      return {
        full: result,
        thumb: {
          id: `${imageId}-thumb`,
          filename: `${imageId}-thumb.jpg`,
          altText: `Thumbnail of ${imageId}`,
          metadata: {
            width: thumbMetadata.width,
            height: thumbMetadata.height,
            format: 'jpg',
            size: fs.statSync(thumbImagePath).size
          }
        }
      };
    }

    return result;
  } catch (error) {
    console.error(`Error processing image ${imageId}:`, error);
    throw error;
  }
}

async function convertBook(filePath) {
  console.log(`\nConverting ${filePath}...`);
  
  try {
    // Read and parse the JSON file
    console.log('Reading JSON file...');
    const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const bookId = parseInt(jsonContent.Id);
    console.log(`Book ID: ${bookId}`);
    console.log(`Title: ${jsonContent.Title}`);
    console.log(`Number of entries: ${jsonContent.Adventure.Entries.length}`);
    console.log(`Number of images: ${jsonContent.Images.length}`);
    
    // Create book directory
    const bookDir = path.join(TARGET_DIR, `book-${bookId.toString().padStart(8, '0')}`);
    if (!fs.existsSync(bookDir)) {
      fs.mkdirSync(bookDir, { recursive: true });
    }

    // Create content directory
    const contentDir = path.join(bookDir, 'content');
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Process images
    const images = {};
    const coverImageCode = jsonContent.Adventure.StartingPoint.ImageCode;
    console.log(`Cover image code: ${coverImageCode}`);
    
    console.log(`Processing ${jsonContent.Images.length} images...`);
    for (const image of jsonContent.Images) {
      try {
        const isCover = image.Code === coverImageCode;
        console.log(`\nProcessing image ${image.Code}...`);
        const imageData = await processImage(image.Image, bookId, image.Code, isCover);
        images[image.Code] = isCover ? imageData.full : imageData;
      } catch (error) {
        console.error(`Failed to process image ${image.Code}:`, error);
        // Continue with other images instead of failing the whole book
        continue;
      }
    }

    // Create metadata.json
    console.log('\nCreating metadata.json...');
    const metadata = {
      id: bookId,
      title: jsonContent.Title,
      authors: jsonContent.Authors,
      credits: jsonContent.Credits,
      version: "1.0.0",
      publishedAt: new Date().toISOString().split('T')[0],
      status: "published"
    };

    // Add cover image if available
    if (coverImageCode && images[coverImageCode]) {
      const coverImage = jsonContent.Images.find(img => img.Code === coverImageCode);
      if (coverImage) {
        try {
          const coverImageData = await processImage(coverImage.Image, bookId, coverImageCode, true);
          metadata.coverImage = {
            full: coverImageData.full,
            thumb: coverImageData.thumb
          };
        } catch (error) {
          console.error(`Failed to process cover image: ${error.message}`);
          // Continue without cover image
        }
      }
    } else {
      console.log('No cover image found, skipping cover image in metadata');
    }

    // Create entries.json
    console.log('Creating entries.json...');
    const entries = {
      entries: {}
    };

    // Process starting point
    console.log('Processing starting point...');
    const startingPoint = jsonContent.Adventure.StartingPoint;
    entries.entries['START'] = {
      text: startingPoint.Text,
      imageId: startingPoint.ImageCode,
      nextSteps: startingPoint.NextSteps.map(step => ({
        description: step.Description,
        target: step.Code
      }))
    };

    // Process other entries
    console.log('Processing other entries...');
    for (const entry of jsonContent.Adventure.Entries) {
      entries.entries[entry.Code] = {
        text: entry.Text,
        imageId: entry.ImageCode,
        nextSteps: entry.NextSteps.map(step => ({
          description: step.Description,
          target: step.Code
        }))
      };
    }

    // Write files
    console.log('Writing files...');
    fs.writeFileSync(
      path.join(bookDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    fs.writeFileSync(
      path.join(bookDir, 'content', 'entries.json'),
      JSON.stringify(entries, null, 2)
    );

    fs.writeFileSync(
      path.join(bookDir, 'content', 'images.json'),
      JSON.stringify({ images }, null, 2)
    );

    console.log(`✓ Converted ${filePath} successfully`);
  } catch (error) {
    console.error(`✗ Error converting ${filePath}:`, error);
    throw error;
  }
}

// Process all JSON files in the source directory
console.log('Starting book conversion...');
const files = fs.readdirSync(SOURCE_DIR)
  .filter(file => file.endsWith('.json') && file !== 'template.json');

if (files.length === 0) {
  console.log('No books found to convert.');
  process.exit(0);
}

console.log(`Found ${files.length} books to convert.`);

Promise.all(files.map(file => {
  const filePath = path.join(SOURCE_DIR, file);
  return convertBook(filePath).catch(error => {
    console.error(`Failed to convert ${file}:`, error);
  });
})).then(() => {
  console.log('\nConversion complete!');
}).catch(error => {
  console.error('\nConversion failed:', error);
  process.exit(1);
}); 