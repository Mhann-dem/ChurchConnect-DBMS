const fs = require('fs');
const path = require('path');

// Configuration
const IMAGE_FOLDER = './src/assets/ministries/transport';
const OUTPUT_FILE = './src/assets/ministries/transport/manifest.json';

// Function to get all image files from a directory
function getImageFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    // Filter for image files (jpg, jpeg, png, gif, webp)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    // Sort files by name
    return imageFiles.sort();
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`);
    return [];
  }
}

// Function to create manifest object
function createManifest(imageFiles) {
  return {
    images: imageFiles
  };
}

// Main execution
function generateManifest() {
  console.log('🔍 Reading image files...');
  const imageFiles = getImageFiles(IMAGE_FOLDER);
  
  if (imageFiles.length === 0) {
    console.log('❌ No image files found!');
    return;
  }
  
  console.log(`✅ Found ${imageFiles.length} images`);
  
  const manifest = createManifest(imageFiles);
  
  // Write to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Manifest generated successfully!`);
  console.log(`📄 Output: ${OUTPUT_FILE}`);
  console.log(`📊 Total images: ${imageFiles.length}`);
}

// Run the script
generateManifest();