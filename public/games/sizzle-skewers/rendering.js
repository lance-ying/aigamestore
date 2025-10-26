import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, SKEWER_TYPES, SPECIAL_TYPES, gameState, LEVELS } from './globals.js';

export function drawStartScreen(p) {
  p.background(40, 30, 25);
  
  // Title
  p.fill(255, 180, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SIZZLE SKEWERS", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(220, 200, 180);
  p.textSize(14);
  p.text("Match 3 or more skewers to clear them!", CANVAS_WIDTH / 2, 140);
  p.text("Complete objectives within the move limit.", CANVAS_WIDTH / 2, 160);
  p.text("Create boosters by matching 4 or 5 in a row!", CANVAS_WIDTH / 2, 180);
  
  // Controls
  p.fill(200, 180, 160);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("Arrow Keys: Move cursor", 150, 220);
  p.text("Space: Select/deselect tile", 150, 240);
  p.text("W/A/S/D: Swap selected tile", 150, 260);
  p.text("Z: Activate Flame Booster", 150, 280);
  p.text("Shift: Activate Grill Flip", 150, 300);
  
  // Start prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

export function drawGame(p) {
  p.background(60, 50, 40);
  
  // Draw UI
  drawUI(p);
  
  // Draw grid background
  p.fill(40, 35, 30);
  p.rect(GRID_OFFSET_X - 5, GRID_OFFSET_Y - 5, GRID_SIZE * CELL_SIZE + 10, GRID_SIZE * CELL_SIZE + 10);
  
  // Draw grid lines
  p.stroke(80, 70, 60);
  p.strokeWeight(1);
  for (let i = 0; i <= GRID_SIZE; i++) {
    p.line(GRID_OFFSET_X, GRID_OFFSET_Y + i * CELL_SIZE, 
           GRID_OFFSET_X + GRID_SIZE * CELL_SIZE, GRID_OFFSET_Y + i * CELL_SIZE);
    p.line(GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y, 
           GRID_OFFSET_X + i * CELL_SIZE, GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE);
  }
  
  // Draw tiles
  drawTiles(p);
  
  // Draw cursor
  drawCursor(p);
  
  // Draw pause indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawUI(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  // Moves
  p.text(`MOVES: ${gameState.movesRemaining}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`LEVEL ${gameState.currentLevel}`, 10, CANVAS_HEIGHT - 10);
  
  // Objectives
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  let yOffset = 30;
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  Object.keys(levelData.objectives).forEach(key => {
    const target = levelData.objectives[key];
    const current = gameState.objectives[key] || 0;
    const completed = current >= target;
    p.fill(...(completed ? [100, 255, 100] : [255, 255, 255]));
    
    let text = '';
    if (key === 'TOTAL') {
      text = `Clear ${target} skewers: ${current}/${target}`;
    } else if (key === 'BURNT') {
      text = `Remove burnt: ${current}/${target}`;
    } else if (key === 'FLAME_ACTIVATED') {
      text = `Activate Flame: ${current}/${target}`;
    } else if (key === 'GRILL_FLIP_ACTIVATED') {
      text = `Activate Grill Flip: ${current}/${target}`;
    } else {
      text = `Clear ${key}: ${current}/${target}`;
    }
    
    p.text(text, CANVAS_WIDTH / 2, yOffset);
    yOffset += 15;
  });
}

function drawTiles(p) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = gameState.grid[row][col];
      if (cell.type === SPECIAL_TYPES.EMPTY) continue;
      
      const x = GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
      const y = GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;
      
      drawSkewer(p, x, y, cell.type, cell.special);
    }
  }
}

function drawSkewer(p, x, y, type, special) {
  p.push();
  p.translate(x, y);
  
  if (type === SPECIAL_TYPES.BURNT) {
    drawBurntBlock(p);
  } else {
    const colors = getSkewerColor(type);
    
    // Base tile
    p.fill(...colors.base);
    p.stroke(...colors.dark);
    p.strokeWeight(2);
    p.ellipse(0, 0, 35, 35);
    
    // Highlight
    p.noStroke();
    p.fill(...colors.light);
    p.ellipse(-5, -5, 12, 12);
    
    // Special overlay
    if (special === SPECIAL_TYPES.FLAME) {
      drawFlameIcon(p);
    } else if (special === SPECIAL_TYPES.GRILL_FLIP) {
      drawGrillFlipIcon(p);
    }
  }
  
  p.pop();
}

function getSkewerColor(type) {
  switch (type) {
    case SKEWER_TYPES.CHICKEN:
      return { base: [255, 200, 100], light: [255, 240, 180], dark: [200, 150, 80] };
    case SKEWER_TYPES.BEEF:
      return { base: [180, 80, 60], light: [220, 120, 100], dark: [120, 50, 40] };
    case SKEWER_TYPES.VEGGIE:
      return { base: [100, 200, 80], light: [150, 240, 130], dark: [60, 140, 50] };
    case SKEWER_TYPES.FISH:
      return { base: [100, 150, 220], light: [150, 200, 255], dark: [60, 100, 160] };
    case SKEWER_TYPES.SHRIMP:
      return { base: [255, 130, 130], light: [255, 180, 180], dark: [200, 80, 80] };
    default:
      return { base: [150, 150, 150], light: [200, 200, 200], dark: [100, 100, 100] };
  }
}

function drawBurntBlock(p) {
  p.fill(40, 30, 25);
  p.stroke(20, 15, 10);
  p.strokeWeight(3);
  p.rect(-15, -15, 30, 30);
  
  // Char marks
  p.noStroke();
  p.fill(0);
  p.ellipse(-5, -5, 8, 8);
  p.ellipse(5, 5, 6, 6);
  p.ellipse(0, 8, 5, 5);
}

function drawFlameIcon(p) {
  p.fill(255, 150, 0, 200);
  p.noStroke();
  p.triangle(-8, 5, 0, -10, 8, 5);
  p.fill(255, 200, 0, 200);
  p.triangle(-5, 3, 0, -6, 5, 3);
}

function drawGrillFlipIcon(p) {
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(2);
  p.noFill();
  p.arc(0, 0, 20, 20, 0, p.PI * 1.5);
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.triangle(8, -8, 12, -4, 8, 0);
}

function drawCursor(p) {
  const x = GRID_OFFSET_X + gameState.cursorX * CELL_SIZE;
  const y = GRID_OFFSET_Y + gameState.cursorY * CELL_SIZE;
  
  // Cursor highlight
  p.noFill();
  p.stroke(255, 220, 100);
  p.strokeWeight(3);
  p.rect(x, y, CELL_SIZE, CELL_SIZE);
  
  // Selected tile highlight
  if (gameState.selectedTile) {
    const sx = GRID_OFFSET_X + gameState.selectedTile.col * CELL_SIZE;
    const sy = GRID_OFFSET_Y + gameState.selectedTile.row * CELL_SIZE;
    p.stroke(100, 150, 255);
    p.strokeWeight(4);
    p.rect(sx, sy, CELL_SIZE, CELL_SIZE);
  }
}

export function drawGameOver(p) {
  p.background(40, 30, 25);
  
  const won = checkWinCondition();
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "LEVEL COMPLETE!" : "GAME OVER!", CANVAS_WIDTH / 2, 100);
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (won) {
    const stars = calculateStars();
    p.textSize(20);
    p.text(`★ ${stars} STARS ★`, CANVAS_WIDTH / 2, 220);
    
    // Bonus
    const movesBonus = gameState.movesRemaining * 50;
    if (movesBonus > 0) {
      p.textSize(16);
      p.text(`Moves Bonus: +${movesBonus}`, CANVAS_WIDTH / 2, 260);
    }
  }
  
  p.fill(255, 220, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

function checkWinCondition() {
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  for (const key in levelData.objectives) {
    const target = levelData.objectives[key];
    const current = gameState.objectives[key] || 0;
    if (current < target) {
      return false;
    }
  }
  
  return true;
}

function calculateStars() {
  const baseScore = gameState.score - (gameState.movesRemaining * 50);
  
  if (baseScore >= 2000) return 3;
  if (baseScore >= 1200) return 2;
  return 1;
}