const fs = require('fs');
const path = require('path');

const GAMES_SOURCE_DIR = path.join(__dirname, 'public/Single_Prompt_Basic');
const GAMES_OUTPUT_DIR = path.join(__dirname, 'public/games');
const MANIFEST_OUTPUT = path.join(__dirname, 'public/games-manifest.json');

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

function extractMetadata(metadataPath) {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(content);
    
    let title = 'Untitled Game';
    let description = '';
    let controls = '';
    
    if (metadata.game_info) {
      title = metadata.game_info.title || 'Untitled Game';
      description = metadata.game_info.description || '';
      controls = metadata.game_info.controls || '';
      
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
    
    return { title, description, controls };
  } catch (error) {
    console.error(`Error parsing metadata: ${error.message}`);
    return { title: 'Untitled Game', description: '', controls: '' };
  }
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
  console.log('Starting single prompt games restructuring...\n');
  console.log(`Source: ${GAMES_SOURCE_DIR}`);
  console.log(`Output: ${GAMES_OUTPUT_DIR}\n`);
  
  ensureDirExists(GAMES_OUTPUT_DIR);
  
  // Load existing manifest if it exists
  let existingGames = [];
  if (fs.existsSync(MANIFEST_OUTPUT)) {
    try {
      const manifestContent = fs.readFileSync(MANIFEST_OUTPUT, 'utf8');
      existingGames = JSON.parse(manifestContent);
      console.log(`Loaded existing manifest with ${existingGames.length} games\n`);
    } catch (e) {
      console.log('Could not load existing manifest, will create new one\n');
    }
  }
  
  const newGames = [];
  const gameDirs = fs.readdirSync(GAMES_SOURCE_DIR).filter(f => {
    const fullPath = path.join(GAMES_SOURCE_DIR, f);
    return fs.statSync(fullPath).isDirectory() && 
           !f.startsWith('.') &&
           !f.endsWith('.zip');
  });
  
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
      metadata = extractMetadata(metadataPath);
    }
    
    // Generate slug
    const slug = kebabCase(gameDir);
    const outputPath = path.join(GAMES_OUTPUT_DIR, slug);
    
    // Check if game already exists
    const existingGame = existingGames.find(g => g.id === slug);
    if (existingGame) {
      console.log(`  → Already exists, skipping\n`);
      return;
    }
    
    // Copy files
    const fileCount = copyGameFiles(samplePath, outputPath);
    
    // Add to manifest
    newGames.push({
      id: slug,
      title: metadata.title,
      description: metadata.description,
      controls: metadata.controls,
      path: `/games/${slug}`,
      originalName: gameDir,
      source: 'single_prompt_basic'
    });
    
    console.log(`  ✓ Created: /public/games/${slug} (${fileCount} files)\n`);
  });
  
  // Merge with existing manifest
  const allGames = [...existingGames, ...newGames];
  
  // Write manifest
  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(allGames, null, 2));
  console.log(`\n✓ Updated manifest with ${newGames.length} new games (${allGames.length} total)`);
  console.log(`  Output: ${MANIFEST_OUTPUT}`);
  
  console.log('\n✓ Restructuring complete!');
  console.log(`\nSummary:`);
  console.log(`  - New games added: ${newGames.length}`);
  console.log(`  - Total games in manifest: ${allGames.length}`);
}

// Run the script
restructureGames();

