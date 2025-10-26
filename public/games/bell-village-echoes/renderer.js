// renderer.js - Rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';
import { LEVEL_DATA, ITEMS } from './levels.js';
import { PUZZLES } from './puzzles.js';

export function drawStartScreen(p) {
  p.background(20, 15, 25);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 150, 255, 50);
  p.noStroke();
  p.textSize(48);
  p.text('BELL VILLAGE ECHOES', CANVAS_WIDTH / 2 + 2, 60 + 2);
  p.fill(220, 200, 255);
  p.text('BELL VILLAGE ECHOES', CANVAS_WIDTH / 2, 60);
  p.pop();
  
  // Subtitle
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(150, 130, 180);
  p.textSize(16);
  p.text('A Mystery Escape Experience', CANVAS_WIDTH / 2, 100);
  p.pop();
  
  // Description
  const desc = [
    'Escape the cursed Bell Village by solving puzzles',
    'across three haunted locations.',
    '',
    'Find hidden objects, decipher ancient codes,',
    'and break the curse before time runs out.'
  ];
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 160, 200);
  p.textSize(14);
  let y = 140;
  desc.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  });
  p.pop();
  
  // Controls
  const controls = [
    'Arrow Keys: Navigate scenes and objects',
    'SPACE: Interact with objects',
    'Z: Open/Close inventory',
    'A/D: Navigate inventory items',
    'SHIFT (hold): Request hint (-100 points)',
    'ESC: Pause game'
  ];
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(160, 140, 180);
  p.textSize(12);
  y = 270;
  controls.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 16;
  });
  p.pop();
  
  // Start prompt with pulse
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 150, 255 * pulse);
  p.textSize(18);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 380);
  p.pop();
}

export function drawPlayingScreen(p) {
  const level = LEVEL_DATA[gameState.currentLevel];
  if (!level) return;
  
  const scene = level.scenes[gameState.currentSceneId];
  if (!scene) return;
  
  // Draw scene background
  drawSceneBackground(p, scene);
  
  // Draw hotspots with highlights
  scene.hotspots.forEach((hotspot, index) => {
    drawHotspot(p, hotspot, index === gameState.selectedHotspotIndex);
  });
  
  // Draw UI
  drawUI(p);
}

function drawSceneBackground(p, scene) {
  // Generate scene-specific background
  const bgColors = {
    entrance: [40, 45, 35],
    courtyard: [35, 40, 45],
    main_door: [45, 35, 40],
    altar_room: [30, 25, 35],
    scroll_chamber: [25, 30, 40],
    hidden_passage: [20, 25, 35],
    crypt_entrance: [15, 15, 20],
    burial_chamber: [20, 15, 25],
    ritual_chamber: [25, 15, 20]
  };
  
  const [r, g, b] = bgColors[scene.id] || [30, 30, 35];
  p.background(r, g, b);
  
  // Add atmospheric gradient
  p.push();
  p.noStroke();
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const alpha = p.map(i, 0, CANVAS_HEIGHT, 0, 60);
    p.fill(0, 0, 0, alpha);
    p.rect(0, i, CANVAS_WIDTH, 1);
  }
  p.pop();
  
  // Draw scene decorations
  drawSceneDecorations(p, scene);
  
  // Scene name
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(120, 110, 130, 180);
  p.textSize(16);
  p.text(scene.name, CANVAS_WIDTH / 2, 30);
  p.pop();
}

function drawSceneDecorations(p, scene) {
  p.push();
  p.noFill();
  p.stroke(80, 70, 90, 100);
  p.strokeWeight(2);
  
  // Draw some atmospheric elements based on scene
  switch (scene.id) {
    case 'entrance':
      // Stone steps
      for (let i = 0; i < 3; i++) {
        p.rect(200 + i * 20, 300 + i * 20, 200 - i * 40, 15);
      }
      break;
    case 'courtyard':
      // Pillars
      p.rect(80, 100, 40, 200);
      p.rect(480, 100, 40, 200);
      break;
    case 'main_door':
      // Door frame
      p.rect(230, 100, 140, 200);
      break;
    case 'altar_room':
      // Altar base
      p.rect(250, 250, 100, 80);
      break;
    case 'crypt_entrance':
      // Arched entrance
      p.arc(300, 180, 120, 140, p.PI, 0);
      break;
  }
  p.pop();
}

function drawHotspot(p, hotspot, isSelected) {
  const state = gameState.hotspotStates[hotspot.id] || hotspot.state;
  
  // Skip if item was collected
  if (hotspot.type === 'item' && state === 'collected') return;
  
  p.push();
  
  // Draw hotspot representation
  if (hotspot.type === 'item') {
    // Draw item sprite
    p.fill(200, 180, 100);
    p.noStroke();
    p.ellipse(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2, 30, 30);
    p.fill(255, 220, 150);
    p.ellipse(hotspot.x + hotspot.width / 2 - 3, hotspot.y + hotspot.height / 2 - 3, 8, 8);
  } else {
    // Draw object outline
    p.noFill();
    p.stroke(100, 90, 110, 120);
    p.strokeWeight(2);
    p.rect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);
  }
  
  // Highlight if selected
  if (isSelected) {
    const pulse = p.sin(p.frameCount * 0.15) * 0.3 + 0.7;
    p.noFill();
    p.stroke(255, 220, 100, 200 * pulse);
    p.strokeWeight(3);
    p.rect(hotspot.x - 5, hotspot.y - 5, hotspot.width + 10, hotspot.height + 10);
    
    // Draw name
    p.fill(255, 220, 150);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(hotspot.name, hotspot.x + hotspot.width / 2, hotspot.y - 15);
  }
  
  p.pop();
}

function drawUI(p) {
  // Level indicator (top-left)
  p.push();
  p.fill(200, 180, 220);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  p.pop();
  
  // Score (top-right)
  p.push();
  p.fill(200, 180, 220);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  const scoreText = `${gameState.score}`.padStart(6, '0');
  p.text(`SCORE: ${scoreText}`, CANVAS_WIDTH - 10, 10);
  p.pop();
  
  // Timer (top-center)
  p.push();
  p.fill(200, 180, 220);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  const minutes = Math.floor(gameState.levelTimeRemaining / 60);
  const seconds = Math.floor(gameState.levelTimeRemaining % 60);
  const timeColor = gameState.levelTimeRemaining < 60 ? [255, 100, 100] : [200, 180, 220];
  p.fill(...timeColor);
  p.text(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 10);
  p.pop();
  
  // Active inventory item indicator
  if (gameState.activeInventoryItemId) {
    const item = ITEMS[gameState.activeInventoryItemId];
    if (item) {
      p.push();
      p.fill(100, 200, 100, 200);
      p.noStroke();
      p.rect(10, CANVAS_HEIGHT - 50, 150, 40, 5);
      p.fill(255);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(12);
      p.text(`Using: ${item.name}`, 20, CANVAS_HEIGHT - 30);
      p.pop();
    }
  }
}

export function drawInventoryScreen(p) {
  // Draw playing screen behind
  drawPlayingScreen(p);
  
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Inventory panel
  const panelX = 100;
  const panelY = 80;
  const panelW = 400;
  const panelH = 240;
  
  p.push();
  p.fill(40, 35, 50);
  p.stroke(120, 100, 140);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelW, panelH, 10);
  p.pop();
  
  // Title
  p.push();
  p.fill(220, 200, 240);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text('INVENTORY', CANVAS_WIDTH / 2, panelY + 15);
  p.pop();
  
  // Item slots
  const slotSize = 60;
  const slotSpacing = 70;
  const startX = panelX + 50;
  const startY = panelY + 60;
  
  if (gameState.inventory.length === 0) {
    p.push();
    p.fill(150, 130, 160);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('No items collected', CANVAS_WIDTH / 2, startY + 60);
    p.pop();
  } else {
    gameState.inventory.forEach((itemId, index) => {
      const item = ITEMS[itemId];
      if (!item) return;
      
      const x = startX + (index % 5) * slotSpacing;
      const y = startY + Math.floor(index / 5) * slotSpacing;
      
      // Slot background
      const isSelected = index === gameState.selectedInventoryIndex;
      p.push();
      p.fill(isSelected ? 60 : 50, isSelected ? 55 : 45, isSelected ? 70 : 60);
      p.stroke(isSelected ? 150 : 100, isSelected ? 200 : 90, isSelected ? 100 : 120);
      p.strokeWeight(isSelected ? 3 : 2);
      p.rect(x, y, slotSize, slotSize, 5);
      p.pop();
      
      // Item representation
      p.push();
      p.fill(200, 180, 100);
      p.noStroke();
      p.ellipse(x + slotSize / 2, y + slotSize / 2, 30, 30);
      p.pop();
      
      // Item name
      if (isSelected) {
        p.push();
        p.fill(255, 220, 150);
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(10);
        p.text(item.name, x + slotSize / 2, y + slotSize + 5);
        p.pop();
      }
    });
  }
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('A/D: Select Item | Z: Close | SPACE: Use Selected Item', CANVAS_WIDTH / 2, panelY + panelH - 10);
  p.pop();
}

export function drawPuzzleScreen(p) {
  const puzzle = PUZZLES[gameState.activePuzzleId];
  if (!puzzle) return;
  
  // Dark background
  p.background(25, 20, 30);
  
  // Puzzle panel
  const panelX = 80;
  const panelY = 60;
  const panelW = 440;
  const panelH = 280;
  
  p.push();
  p.fill(45, 40, 55);
  p.stroke(130, 110, 150);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelW, panelH, 10);
  p.pop();
  
  // Puzzle title
  p.push();
  p.fill(220, 200, 240);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text(puzzle.name, CANVAS_WIDTH / 2, panelY + 15);
  p.pop();
  
  // Puzzle description
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text(puzzle.description, CANVAS_WIDTH / 2, panelY + 40);
  p.pop();
  
  // Puzzle-specific rendering
  switch (puzzle.type) {
    case 'code':
      drawCodePuzzle(p, puzzle, panelX, panelY, panelW, panelH);
      break;
    case 'sequence':
      drawSequencePuzzle(p, puzzle, panelX, panelY, panelW, panelH);
      break;
    case 'slider':
      drawSliderPuzzle(p, puzzle, panelX, panelY, panelW, panelH);
      break;
    case 'matching':
      drawMatchingPuzzle(p, puzzle, panelX, panelY, panelW, panelH);
      break;
    case 'riddle':
      drawRiddlePuzzle(p, puzzle, panelX, panelY, panelW, panelH);
      break;
    case 'balance':
      drawBalancePuzzle(p, puzzle, panelX, panelY, panelW, panelH);
      break;
    case 'ritual':
      drawRitualPuzzle(p, puzzle, panelX, panelY, panelW, panelH);
      break;
  }
  
  // Instructions
  p.push();
  p.fill(160, 140, 180);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text('ESC: Close Puzzle', CANVAS_WIDTH / 2, panelY + panelH - 10);
  p.pop();
}

function drawCodePuzzle(p, puzzle, x, y, w, h) {
  // Display current code
  p.push();
  p.fill(60, 55, 70);
  p.stroke(150, 130, 170);
  p.strokeWeight(2);
  p.rect(x + w / 2 - 100, y + 100, 200, 50, 5);
  p.pop();
  
  p.push();
  p.fill(220, 200, 240);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(puzzle.currentCode || '____', x + w / 2, y + 125);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text('Use number keys (0-9) to enter code', x + w / 2, y + 180);
  p.text('SPACE: Confirm | Arrow Up: Clear', x + w / 2, y + 200);
  p.pop();
}

function drawSequencePuzzle(p, puzzle, x, y, w, h) {
  const items = puzzle.id === 'tablet_arrangement' ? 
    ['Moon', 'Sun', 'Star'] : 
    puzzle.id === 'sound_sequence' ? 
    ['Bell 1', 'Bell 2', 'Bell 3', 'Bell 4', 'Bell 1'] :
    ['Lever 1', 'Lever 2', 'Lever 3', 'Lever 4', 'Lever 2'];
  
  // Display current sequence
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('Current Sequence:', x + 40, y + 80);
  p.pop();
  
  let seqX = x + 40;
  let seqY = y + 110;
  puzzle.currentSequence.forEach((idx, i) => {
    p.push();
    p.fill(60, 55, 70);
    p.stroke(150, 130, 170);
    p.strokeWeight(2);
    p.rect(seqX, seqY, 80, 40, 5);
    p.pop();
    
    p.push();
    p.fill(220, 200, 240);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(items[idx] || `Item ${idx}`, seqX + 40, seqY + 20);
    p.pop();
    
    seqX += 90;
    if ((i + 1) % 4 === 0) {
      seqX = x + 40;
      seqY += 50;
    }
  });
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('Number keys to add to sequence | Arrow Up: Clear | SPACE: Check', x + w / 2, y + h - 30);
  p.pop();
}

function drawSliderPuzzle(p, puzzle, x, y, w, h) {
  const tileSize = 50;
  const startX = x + w / 2 - (puzzle.gridSize * tileSize) / 2;
  const startY = y + 90;
  
  puzzle.tiles.forEach((tile, index) => {
    const row = Math.floor(index / puzzle.gridSize);
    const col = index % puzzle.gridSize;
    const tileX = startX + col * tileSize;
    const tileY = startY + row * tileSize;
    
    if (tile === 0) return; // Empty tile
    
    p.push();
    p.fill(60, 55, 70);
    p.stroke(150, 130, 170);
    p.strokeWeight(2);
    p.rect(tileX, tileY, tileSize - 2, tileSize - 2, 3);
    p.pop();
    
    p.push();
    p.fill(220, 200, 240);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(tile, tileX + tileSize / 2, tileY + tileSize / 2);
    p.pop();
  });
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('Arrow keys to slide tiles', x + w / 2, y + h - 30);
  p.pop();
}

function drawMatchingPuzzle(p, puzzle, x, y, w, h) {
  const symbols = ['○', '△', '□', '★'];
  const symbolX = x + 80;
  const symbolY = y + 100;
  
  puzzle.symbols.forEach((symbol, index) => {
    const posX = symbolX + (index % 2) * 180;
    const posY = symbolY + Math.floor(index / 2) * 80;
    
    p.push();
    p.fill(60, 55, 70);
    p.stroke(150, 130, 170);
    p.strokeWeight(2);
    p.rect(posX, posY, 70, 60, 5);
    p.pop();
    
    p.push();
    p.fill(220, 200, 240);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text(symbols[puzzle.currentMatches[index]], posX + 35, posY + 30);
    p.pop();
  });
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('Use number keys (0-3) to cycle symbols | SPACE: Check', x + w / 2, y + h - 30);
  p.pop();
}

function drawRiddlePuzzle(p, puzzle, x, y, w, h) {
  // Riddle text
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(13);
  const words = puzzle.riddle.split(' ');
  let line = '';
  let lineY = y + 80;
  words.forEach(word => {
    if (p.textWidth(line + word) > w - 100) {
      p.text(line, x + w / 2, lineY);
      line = word + ' ';
      lineY += 20;
    } else {
      line += word + ' ';
    }
  });
  p.text(line, x + w / 2, lineY);
  p.pop();
  
  // Answer input
  p.push();
  p.fill(60, 55, 70);
  p.stroke(150, 130, 170);
  p.strokeWeight(2);
  p.rect(x + w / 2 - 80, y + 180, 160, 40, 5);
  p.pop();
  
  p.push();
  p.fill(220, 200, 240);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(puzzle.currentAnswer || '_____', x + w / 2, y + 200);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text('Type your answer | Arrow Up: Clear | SPACE: Submit', x + w / 2, y + h - 30);
  p.pop();
}

function drawBalancePuzzle(p, puzzle, x, y, w, h) {
  // Scale visualization
  p.push();
  p.stroke(150, 130, 170);
  p.strokeWeight(3);
  p.line(x + w / 2, y + 120, x + w / 2, y + 180);
  p.line(x + w / 2 - 80, y + 180, x + w / 2 + 80, y + 180);
  p.pop();
  
  // Current weight
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`Current: ${puzzle.currentWeight} / Target: ${puzzle.targetWeight}`, x + w / 2, y + 80);
  p.pop();
  
  // Placed items
  let itemY = y + 200;
  puzzle.placedItems.forEach(itemId => {
    const item = ITEMS[itemId];
    if (item) {
      p.push();
      p.fill(180, 160, 200);
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(12);
      p.text(`${item.name} (${puzzle.itemWeights[itemId]})`, x + w / 2, itemY);
      p.pop();
      itemY += 20;
    }
  });
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text('Use inventory items | SPACE: Place selected item', x + w / 2, y + h - 30);
  p.pop();
}

function drawRitualPuzzle(p, puzzle, x, y, w, h) {
  // Required items checklist
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('Required Items:', x + 40, y + 70);
  p.pop();
  
  let itemY = y + 95;
  puzzle.requiredItems.forEach(itemId => {
    const item = ITEMS[itemId];
    const isPlaced = puzzle.placedItems.includes(itemId);
    p.push();
    p.fill(isPlaced ? 100 : 180, isPlaced ? 200 : 160, isPlaced ? 100 : 200);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`${isPlaced ? '✓' : '○'} ${item.name}`, x + 60, itemY);
    p.pop();
    itemY += 20;
  });
  
  // Code input
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('Final Code:', x + 40, y + 170);
  p.pop();
  
  p.push();
  p.fill(60, 55, 70);
  p.stroke(150, 130, 170);
  p.strokeWeight(2);
  p.rect(x + 40, y + 195, 120, 40, 5);
  p.pop();
  
  p.push();
  p.fill(220, 200, 240);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text(puzzle.currentCode || '___', x + 100, y + 215);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(180, 160, 200);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text('SPACE: Place inventory items | Number keys: Enter code', x + w / 2, y + h - 30);
  p.pop();
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Paused text
  p.push();
  p.fill(220, 200, 240);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  p.pop();
  
  // Menu
  p.push();
  p.fill(220, 200, 240);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text('ESC: Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.text('R: Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.pop();
}

export function drawLevelCompleteScreen(p) {
  p.background(20, 15, 25);
  
  const isGameComplete = gameState.currentLevel >= 3;
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 255, 200);
  p.textSize(36);
  p.text(isGameComplete ? 'GAME COMPLETE!' : 'LEVEL COMPLETE!', CANVAS_WIDTH / 2, 80);
  p.pop();
  
  // Score breakdown
  const breakdown = [
    `Level Score: ${gameState.levelScore}`,
    `Time Bonus: ${gameState.timeBonus}`,
    `No Hint Bonus: ${gameState.noHintBonus}`,
    `Speed Run Bonus: ${gameState.speedRunBonus}`,
    ``,
    `Total Score: ${gameState.score}`
  ];
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 160, 200);
  p.textSize(16);
  let y = 150;
  breakdown.forEach(line => {
    if (line === '') {
      y += 10;
    } else {
      const isTotal = line.includes('Total');
      if (isTotal) {
        p.fill(220, 200, 240);
        p.textSize(20);
      }
      p.text(line, CANVAS_WIDTH / 2, y);
      if (isTotal) {
        p.fill(180, 160, 200);
        p.textSize(16);
      }
      y += 25;
    }
  });
  p.pop();
  
  // Continue prompt
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 150, 255 * pulse);
  p.textSize(18);
  if (isGameComplete) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 340);
  } else {
    p.text('PRESS SPACE FOR NEXT LEVEL', CANVAS_WIDTH / 2, 340);
  }
  p.pop();
}

export function drawGameOverScreen(p) {
  p.background(30, 20, 25);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(...(isWin ? [200, 255, 200] : [255, 100, 100]));
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'TIME\'S UP', CANVAS_WIDTH / 2, 100);
  p.pop();
  
  // Message
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 160, 200);
  p.textSize(16);
  if (isWin) {
    p.text('You have escaped Bell Village!', CANVAS_WIDTH / 2, 160);
  } else {
    p.text('The curse remains...', CANVAS_WIDTH / 2, 160);
  }
  p.pop();
  
  // Final score
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(220, 200, 240);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.pop();
  
  // Restart prompt
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 150, 255 * pulse);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  p.pop();
}