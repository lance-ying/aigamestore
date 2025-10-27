const fs = require('fs');
const path = require('path');

const GAMES_SOURCE_DIR = path.join(__dirname, 'games');
const GAMES_OUTPUT_DIR = path.join(__dirname, 'public/games');
const MANIFEST_OUTPUT = path.join(__dirname, 'public/games-manifest.json');

// Files to exclude from copying
const EXCLUDE_FILES = ['generation_log.json', 'intermediate_outputs.json'];

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

function findGameFiles(gameDir) {
  // Navigate through the nested structure: gamename/sample_0/game_0000/sample_0/
  const sampleDirs = fs.readdirSync(gameDir).filter(f => 
    fs.statSync(path.join(gameDir, f)).isDirectory() && f.startsWith('sample')
  );
  
  if (sampleDirs.length === 0) return null;
  
  const samplePath = path.join(gameDir, sampleDirs[0]);
  const gameDirs = fs.readdirSync(samplePath).filter(f => 
    fs.statSync(path.join(samplePath, f)).isDirectory() && f.startsWith('game')
  );
  
  if (gameDirs.length === 0) return null;
  
  const gamePath = path.join(samplePath, gameDirs[0]);
  const innerSampleDirs = fs.readdirSync(gamePath).filter(f => 
    fs.statSync(path.join(gamePath, f)).isDirectory() && f.startsWith('sample')
  );
  
  if (innerSampleDirs.length === 0) return null;
  
  return path.join(gamePath, innerSampleDirs[0]);
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

function copyGameFiles(sourceDir, destDir, gameName) {
  ensureDirExists(destDir);
  
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    if (EXCLUDE_FILES.includes(file)) {
      return; // Skip excluded files
    }
    
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      // Don't copy subdirectories
      return;
    }
    
    fs.copyFileSync(sourcePath, destPath);
    console.log(`  Copied: ${file}`);
  });
}

function restructureGames() {
  console.log('Starting game restructuring...\n');
  
  ensureDirExists(GAMES_OUTPUT_DIR);
  
  const games = [];
  const gameDirs = fs.readdirSync(GAMES_SOURCE_DIR).filter(f => {
    const fullPath = path.join(GAMES_SOURCE_DIR, f);
    return fs.statSync(fullPath).isDirectory() && 
           !f.startsWith('.') && 
           !f.startsWith('sample_') &&
           !f.startsWith('single_prompt');
  });
  
  console.log(`Found ${gameDirs.length} game directories\n`);
  
  gameDirs.forEach((gameDir, index) => {
    console.log(`[${index + 1}/${gameDirs.length}] Processing: ${gameDir}`);
    
    const sourcePath = path.join(GAMES_SOURCE_DIR, gameDir);
    const gameFilesPath = findGameFiles(sourcePath);
    
    if (!gameFilesPath) {
      console.log(`  ⚠️  Skipped: Could not find game files\n`);
      return;
    }
    
    // Check if index.html exists
    const indexPath = path.join(gameFilesPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.log(`  ⚠️  Skipped: No index.html found\n`);
      return;
    }
    
    // Extract metadata
    const metadataPath = path.join(gameFilesPath, 'metadata.json');
    let metadata = { title: gameDir.replace(/_/g, ' '), description: '', controls: '' };
    
    if (fs.existsSync(metadataPath)) {
      metadata = extractMetadata(metadataPath);
    }
    
    // Generate slug
    const slug = kebabCase(gameDir);
    const outputPath = path.join(GAMES_OUTPUT_DIR, slug);
    
    // Copy files
    copyGameFiles(gameFilesPath, outputPath, gameDir);
    
    // Add to manifest
    games.push({
      id: slug,
      title: metadata.title,
      description: metadata.description,
      controls: metadata.controls,
      path: `/games/${slug}`,
      originalName: gameDir
    });
    
    console.log(`  ✓ Created: /public/games/${slug}\n`);
  });
  
  // Write manifest
  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(games, null, 2));
  console.log(`\n✓ Generated manifest with ${games.length} games`);
  console.log(`  Output: ${MANIFEST_OUTPUT}`);
  
  console.log('\n✓ Restructuring complete!');
}

// Run the script
restructureGames();

