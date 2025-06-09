const fs = require('fs');
const path = require('path');

// Function to process a single JSON file
function processJsonFile(filePath) {
    console.log(`Processing ${filePath}...`);
    
    // Read and parse the JSON file
    const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let nextImageCode = 15; // Starting from 15 as mentioned
    
    // Function to process entries recursively
    function processEntries(entries) {
        entries.forEach(entry => {
            // Check if entry has an image array
            if (Array.isArray(entry.Image)) {
                // Create new Image object in root Images array
                const imageCode = `img${nextImageCode}`;
                jsonContent.Images.push({
                    Code: imageCode,
                    Image: entry.Image[0] // Assuming we want the first image
                });
                
                // Replace Image array with ImageCode
                entry.ImageCode = imageCode;
                delete entry.Image;
                
                nextImageCode++;
            }
            
            // Process NextSteps if they exist
            if (entry.NextSteps) {
                processEntries(entry.NextSteps);
            }
        });
    }
    
    // Initialize Images array if it doesn't exist
    if (!jsonContent.Images) {
        jsonContent.Images = [];
    }
    
    // Process the adventure entries
    processEntries([jsonContent.Adventure.StartingPoint, ...jsonContent.Adventure.Entries]);
    
    // Write the modified content back to file
    const outputPath = filePath.replace('.json', '_transformed.json');
    fs.writeFileSync(outputPath, JSON.stringify(jsonContent, null, 2));
    console.log(`Transformed file saved as ${outputPath}`);
}

// Process all JSON files in the json_books directory
const jsonBooksDir = path.join(__dirname, '..', 'public', 'json_books');
const files = fs.readdirSync(jsonBooksDir);

files.forEach(file => {
    if (file.endsWith('.json') && file !== 'template.json') {
        const filePath = path.join(jsonBooksDir, file);
        processJsonFile(filePath);
    }
}); 