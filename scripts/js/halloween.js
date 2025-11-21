const fs = require('fs');
const path = require('path');

const GAMES_SOURCE_DIR = path.join(__dirname, 'games/single_prompt_with_testing');
const GAMES_OUTPUT_DIR = path.join(__dirname, 'public/games_gen_halloween');
const MANIFEST_OUTPUT = path.join(__dirname, 'public/games_gen_halloween/games-manifest.json');

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
    .replace(/[^\w\-]+/g, '') // Remove non-word chars except hyphens
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single
    .toLowerCase()
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

function extractGameTitle(metadataPath) {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(content);
    
    if (metadata.game_info) {
      let title = metadata.game_info.title;
      
      // If title is "Untitled Game", try to extract from concept
      if (!title || title === 'Untitled Game') {
        if (metadata.game_info.concept) {
          // Look for **Game Name** pattern at the start of concept
          const conceptMatch = metadata.game_info.concept.match(/^\*\*([^*]+)\*\*/);
          if (conceptMatch) {
            title = conceptMatch[1].trim();
            // Remove trailing colons if present
            title = title.replace(/:$/, '');
          }
        }
      }
      
      return title || 'Untitled Game';
    }
    
    return 'Untitled Game';
  } catch (error) {
    console.error(`Error parsing metadata: ${error.message}`);
    return 'Untitled Game';
  }
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
      
      // Try to extract from concept if title is still "Untitled Game"
      if (title === 'Untitled Game' && metadata.game_info.concept) {
        const conceptMatch = metadata.game_info.concept.match(/^\*\*([^*]+)\*\*/);
        if (conceptMatch) {
          title = conceptMatch[1].trim().replace(/:$/, '');
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
      // Skip subdirectories
      return;
    }
    
    fs.copyFileSync(sourcePath, destPath);
    copiedCount++;
  });
  
  return copiedCount;
}

function restructureGames() {
  console.log('Starting Halloween games restructuring...\n');
  console.log(`Source: ${GAMES_SOURCE_DIR}`);
  console.log(`Output: ${GAMES_OUTPUT_DIR}\n`);
  
  ensureDirExists(GAMES_OUTPUT_DIR);
  
  const games = [];
  const slugCounts = {}; // Track slug usage to avoid collisions
  
  // Process game_0000 through game_0015
  for (let i = 0; i <= 15; i++) {
    const gameNum = String(i).padStart(4, '0');
    const gameDir = `game_${gameNum}`;
    const gamePath = path.join(GAMES_SOURCE_DIR, gameDir);
    
    if (!fs.existsSync(gamePath)) {
      console.log(`⚠️  Skipped: ${gameDir} (not found)\n`);
      continue;
    }
    
    console.log(`Processing: ${gameDir}`);
    
    // Find all sample directories (excluding backups)
    const sampleDirs = fs.readdirSync(gamePath)
      .filter(f => {
        const fullPath = path.join(gamePath, f);
        return fs.statSync(fullPath).isDirectory() && 
               f.match(/^sample_\d+$/) && // Only sample_N, not backups
               !f.includes('backup');
      })
      .sort(); // Sort to ensure consistent ordering
    
    console.log(`  Found ${sampleDirs.length} samples`);
    
    sampleDirs.forEach((sampleDir, index) => {
      const sourcePath = path.join(gamePath, sampleDir);
      
      // Check if index.html exists
      const indexPath = path.join(sourcePath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        console.log(`  ⚠️  Skipped ${sampleDir}: No index.html found`);
        return;
      }
      
      // Extract metadata
      const metadataPath = path.join(sourcePath, 'metadata.json');
      let metadata = { 
        title: `Game ${gameNum}`, 
        description: '', 
        controls: '' 
      };
      
      let gameTitle = `game-${gameNum}`;
      
      if (fs.existsSync(metadataPath)) {
        metadata = extractMetadata(metadataPath);
        gameTitle = extractGameTitle(metadataPath);
      }
      
      // Generate base slug from game title
      const sampleNum = sampleDir.replace('sample_', '');
      let baseSlug = kebabCase(gameTitle);
      
      // If still untitled or empty, use game number
      if (!baseSlug || baseSlug === 'untitled-game') {
        baseSlug = `game-${gameNum}`;
      }
      
      // Create slug with sample number
      let slug = `${baseSlug}-s${sampleNum}`;
      
      // Handle collisions by appending game number
      if (slugCounts[slug]) {
        slug = `${baseSlug}-s${sampleNum}-g${gameNum}`;
      }
      slugCounts[slug] = (slugCounts[slug] || 0) + 1;
      
      const outputPath = path.join(GAMES_OUTPUT_DIR, slug);
      
      // Copy files
      const fileCount = copyGameFiles(sourcePath, outputPath);
      
      // Add to manifest
      games.push({
        id: slug,
        title: metadata.title,
        description: metadata.description,
        controls: metadata.controls,
        path: `/games_gen_halloween/${slug}`,
        originalName: gameDir,
        originalSample: sampleDir,
        gameNumber: gameNum,
        sampleNumber: sampleNum,
        source: 'single_prompt_with_testing'
      });
      
      console.log(`  ✓ Created: ${slug} (${fileCount} files) - "${metadata.title}"`);
    });
    
    console.log('');
  }
  
  // Write manifest
  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(games, null, 2));
  console.log(`\n✓ Generated manifest with ${games.length} games`);
  console.log(`  Output: ${MANIFEST_OUTPUT}`);
  
  console.log('\n✓ Restructuring complete!');
  console.log(`\nSummary:`);
  console.log(`  - Total games processed: ${games.length}`);
  console.log(`  - Output directory: ${GAMES_OUTPUT_DIR}`);
}

// Run the script
restructureGames();