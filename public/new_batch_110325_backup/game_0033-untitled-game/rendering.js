// rendering.js - All rendering functions
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRID_SIZE, 
  TILE_SIZE, 
  GRID_OFFSET_X, 
  GRID_OFFSET_Y,
  TILE_TYPES 
} from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('ISLE OF ARROWS', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(200);
  p.text('Tower Defense Puzzle', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180);
  
  const instructions = [
    'OBJECTIVE:',
    '• Build towers to defend against enemy waves',
    '• Roads extend enemy paths for more tower time',
    '• Gardens generate coins each second',
    '• Flags expand your buildable territory',
    '• Survive all 5 waves to win!',
    '',
    'CONTROLS:',
    '• Arrow Keys: Move tile cursor',
    '• Space: Place tile',
    '• Shift: Skip tile (costs 10 coins)',
    '• Z: Call wave when ready',
    '',
    'PRESS ENTER TO START'
  ];
  
  let yPos = 150;
  for (let line of instructions) {
    p.text(line, 80, yPos);
    yPos += 18;
  }
}

export function renderGameplay(p) {
  p.background(40, 60, 80);
  
  // Render grid background
  renderGrid(p);
  
  // Render tiles
  renderTiles(p);
  
  // Render buildable area highlight
  renderBuildableArea(p);
  
  // Render cursor
  if (gameState.currentTile && !gameState.waveInProgress) {
    renderCursor(p);
  }
  
  // Render enemies
  for (let enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  // Render projectiles
  for (let proj of gameState.projectiles) {
    proj.render(p);
  }
  
  // Render UI
  renderUI(p);
  
  // Render current tile info
  if (gameState.currentTile && !gameState.waveInProgress) {
    renderCurrentTileInfo(p);
  }
}

function renderGrid(p) {
  p.stroke(60, 80, 100);
  p.strokeWeight(1);
  p.noFill();
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const screenX = GRID_OFFSET_X + x * TILE_SIZE;
      const screenY = GRID_OFFSET_Y + y * TILE_SIZE;
      p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }
}

function renderTiles(p) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = gameState.grid[y][x];
      const screenX = GRID_OFFSET_X + x * TILE_SIZE;
      const screenY = GRID_OFFSET_Y + y * TILE_SIZE;
      
      if (tile.type !== TILE_TYPES.EMPTY) {
        renderTile(p, tile, screenX, screenY);
      }
    }
  }
}

function renderTile(p, tile, x, y) {
  const centerX = x + TILE_SIZE / 2;
  const centerY = y + TILE_SIZE / 2;
  
  switch (tile.type) {
    case TILE_TYPES.TOWER:
    case TILE_TYPES.ARCHER:
    case TILE_TYPES.CANNON:
    case TILE_TYPES.MAGIC:
      p.fill(...tile.data.color);
      p.stroke(0);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(centerX, centerY, TILE_SIZE - 8, TILE_SIZE - 8, 4);
      p.rectMode(p.CORNER);
      
      // Tower barrel
      p.fill(50);
      p.ellipse(centerX, centerY, 8, 8);
      break;
      
    case TILE_TYPES.ROAD:
      p.fill(120, 100, 80);
      p.noStroke();
      p.rect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      
      // Road lines
      p.stroke(140, 120, 100);
      p.strokeWeight(1);
      p.line(x + 4, centerY, x + TILE_SIZE - 4, centerY);
      break;
      
    case TILE_TYPES.FLAG:
      p.fill(200, 50, 50);
      p.noStroke();
      p.rect(centerX - 2, y + 8, 4, TILE_SIZE - 12);
      
      // Flag
      p.fill(220, 70, 70);
      p.triangle(
        centerX + 2, y + 8,
        centerX + 2, y + 18,
        centerX + 15, y + 13
      );
      break;
      
    case TILE_TYPES.GARDEN:
      p.fill(50, 200, 50);
      p.noStroke();
      p.rect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8, 4);
      
      // Flowers
      p.fill(255, 200, 50);
      p.ellipse(centerX - 6, centerY - 4, 6, 6);
      p.ellipse(centerX + 4, centerY - 6, 6, 6);
      p.ellipse(centerX + 2, centerY + 4, 6, 6);
      break;
  }
}

function renderBuildableArea(p) {
  p.noFill();
  p.stroke(100, 255, 100, 100);
  p.strokeWeight(2);
  
  for (let pos of gameState.buildableArea) {
    if (gameState.grid[pos.y][pos.x].type === TILE_TYPES.EMPTY) {
      const screenX = GRID_OFFSET_X + pos.x * TILE_SIZE;
      const screenY = GRID_OFFSET_Y + pos.y * TILE_SIZE;
      p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }
}

function renderCursor(p) {
  const screenX = GRID_OFFSET_X + gameState.cursorX * TILE_SIZE;
  const screenY = GRID_OFFSET_Y + gameState.cursorY * TILE_SIZE;
  
  // Cursor outline
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  
  // Preview tile
  if (gameState.currentTile) {
    p.push();
    p.tint(255, 200);
    const tile = { type: gameState.currentTile.type, data: gameState.currentTile };
    renderTile(p, tile, screenX, screenY);
    p.pop();
  }
}

function renderUI(p) {
  // Top bar
  p.fill(30, 40, 60);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Coins
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Coins: ${gameState.coins}`, 10, 20);
  
  // Score
  p.text(`Score: ${gameState.score}`, 150, 20);
  
  // Wave
  p.text(`Wave: ${gameState.wave}/${gameState.maxWaves}`, 300, 20);
  
  // Escaped
  p.fill(200, 50, 50);
  p.text(`Escaped: ${gameState.escapedEnemies}/${gameState.maxEscapedEnemies}`, 450, 20);
  
  // Instructions
  if (!gameState.waveInProgress && gameState.currentTile) {
    p.fill(200);
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Space: Place | Shift: Skip (10 coins)', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
  }
  
  if (!gameState.waveInProgress && gameState.wave < gameState.maxWaves) {
    p.fill(100, 255, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Press Z to Call Wave', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 45);
  }
}

function renderCurrentTileInfo(p) {
  if (!gameState.currentTile) return;
  
  const boxX = 420;
  const boxY = 60;
  const boxW = 170;
  const boxH = 120;
  
  p.fill(30, 40, 60, 230);
  p.stroke(100);
  p.strokeWeight(2);
  p.rect(boxX, boxY, boxW, boxH, 5);
  
  p.fill(255, 220, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.noStroke();
  p.text(gameState.currentTile.name, boxX + 10, boxY + 10);
  
  p.fill(200);
  p.textSize(11);
  p.text(gameState.currentTile.description, boxX + 10, boxY + 30, boxW - 20);
  
  // Stats
  if (gameState.currentTile.range) {
    p.text(`Range: ${gameState.currentTile.range}`, boxX + 10, boxY + 60);
    p.text(`Damage: ${gameState.currentTile.damage}`, boxX + 10, boxY + 75);
    p.text(`Cooldown: ${Math.floor(gameState.currentTile.cooldown / 60)}s`, boxX + 10, boxY + 90);
  }
}

export function renderPauseScreen(p) {
  renderGameplay(p);
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOverScreen(p) {
  renderGameplay(p);
  
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? 'VICTORY!' : 'DEFEAT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text(`Waves Survived: ${gameState.wave}/${gameState.maxWaves}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.textSize(16);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}