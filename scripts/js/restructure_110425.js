const fs = require('fs');
const path = require('path');

// Restructure games from batch_110425 to public/batch_110425
const GAMES_SOURCE_DIR = path.join(__dirname, 'games/batch_110425');
const GAMES_OUTPUT_DIR = path.join(__dirname, 'public/batch_110425');
const MANIFEST_OUTPUT = path.join(__dirname, 'public/batch_110425-manifest.json');

// Files to exclude from copying
const EXCLUDE_FILES = ['generation_log.json', 'intermediate_outputs.json', 'game_check_results'];

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function extractMetadata(metadataPath, gameDir, samplePath) {
  let title = 'Untitled Game';
  let description = '';
  let controls = '';
  
  // First, try to extract title from index.html
  try {
    const indexPath = path.join(samplePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      // Look for <h1 id="gameTitle">Title Here</h1>
      const titleMatch = htmlContent.match(/<h1\s+id="gameTitle"[^>]*>([^<]+)<\/h1>/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
    }
  } catch (error) {
    // Fall through to metadata extraction
  }
  
  // Then try to get description and controls from metadata
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(content);
    
    if (metadata.game_info) {
      description = metadata.game_info.description || '';
      controls = metadata.game_info.controls || '';
      
      // If no title from HTML, try metadata
      if (title === 'Untitled Game') {
        title = metadata.game_info.title || gameDir;
        
        // Try to parse concept if title is still "Untitled Game"
        if (title === 'Untitled Game' && metadata.game_info.concept) {
          try {
            const concept = JSON.parse(metadata.game_info.concept);
            if (concept.game_name) {
              title = concept.game_name;
            }
          } catch (e) {
            // Concept might not be JSON
          }
        }
      }
    }
  } catch (error) {
    // Continue with empty description/controls
  }
  
  return { title, description, controls };
}

function copyGameFiles(sourceDir, destDir) {
  ensureDirExists(destDir);
  
  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;
  
  files.forEach(file => {
    if (EXCLUDE_FILES.includes(file)) {
      return; // Skip excluded files
    }
    
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      // Skip subdirectories (like game_check_results)
      return;
    }
    
    fs.copyFileSync(sourcePath, destPath);
    copiedCount++;
  });
  
  return copiedCount;
}

function restructureGames() {
  console.log('Starting batch_110425 games restructuring...\n');
  console.log(`Source: ${GAMES_SOURCE_DIR}`);
  console.log(`Output: ${GAMES_OUTPUT_DIR}\n`);
  
  // Check if source directory exists
  if (!fs.existsSync(GAMES_SOURCE_DIR)) {
    console.error(`Error: Source directory does not exist: ${GAMES_SOURCE_DIR}`);
    process.exit(1);
  }
  
  ensureDirExists(GAMES_OUTPUT_DIR);
  
  // Generate fresh manifest for all games
  console.log('Generating fresh manifest for all games\n');
  
  const newGames = [];
  
  // Get all game_XXXX directories
  const gameDirs = fs.readdirSync(GAMES_SOURCE_DIR).filter(f => {
    const fullPath = path.join(GAMES_SOURCE_DIR, f);
    return fs.statSync(fullPath).isDirectory() && 
           f.match(/^game_\d+$/) &&
           !f.startsWith('.');
  }).sort();
  
  console.log(`Found ${gameDirs.length} game directories\n`);
  
  gameDirs.forEach((gameDir, index) => {
    console.log(`[${index + 1}/${gameDirs.length}] Processing: ${gameDir}`);
    
    const sourcePath = path.join(GAMES_SOURCE_DIR, gameDir);
    
    // Look for sample_0 directory
    const samplePath = path.join(sourcePath, 'sample_0');
    
    if (!fs.existsSync(samplePath)) {
      console.log(`  ⚠️  Skipped: No sample_0 directory found\n`);
      return;
    }
    
    // Check if index.html exists
    const indexPath = path.join(samplePath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.log(`  ⚠️  Skipped: No index.html found in sample_0\n`);
      return;
    }
    
    // Extract metadata
    const metadataPath = path.join(samplePath, 'metadata.json');
    let metadata = { title: gameDir, description: '', controls: '' };
    
    if (fs.existsSync(metadataPath)) {
      metadata = extractMetadata(metadataPath, gameDir, samplePath);
    }
    
    // Generate slug from title
    const titleSlug = kebabCase(metadata.title);
    const slug = titleSlug;
    const outputPath = path.join(GAMES_OUTPUT_DIR, slug);
    
    // Copy files
    const fileCount = copyGameFiles(samplePath, outputPath);
    
    if (fileCount === 0) {
      console.log(`  ⚠️  Skipped: No files to copy\n`);
      return;
    }
    
    // Add to manifest
    newGames.push({
      id: slug,
      title: metadata.title,
      description: metadata.description,
      controls: metadata.controls,
      path: `/batch_110425/${slug}`,
      originalName: gameDir,
      source: 'batch_110425'
    });
    
    console.log(`  ✓ Created: /public/batch_110425/${slug} (${fileCount} files)\n`);
  });
  
  // Write fresh manifest
  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(newGames, null, 2));
  console.log(`\n✓ Generated fresh manifest with ${newGames.length} games`);
  console.log(`  Output: ${MANIFEST_OUTPUT}`);
  
  console.log('\n✓ Restructuring complete!');
  console.log(`\nSummary:`);
  console.log(`  - Total games generated: ${newGames.length}`);
  console.log(`  - Location: ${GAMES_OUTPUT_DIR}`);
}

// Run the script
restructureGames();