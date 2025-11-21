// rendering.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_SIZE } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 20, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('ROYAL KINGDOM', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text('Match 3 or more tiles to complete objectives!', CANVAS_WIDTH / 2, 140);
  p.text('Create special pieces by matching 4 or 5 tiles.', CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(200, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT);
  p.text('Arrow Keys / WASD: Move cursor', 50, 200);
  p.text('Space: Select tile / Swap / Activate', 50, 220);
  p.text('ESC: Pause game', 50, 240);
  p.text('R: Restart (from game over)', 50, 260);
  
  // Objectives
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text('Complete objectives before moves run out!', CANVAS_WIDTH / 2, 300);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  p.background(40, 30, 60);
  
  // UI
  renderUI(p);
  
  // Board
  renderBoard(p);
  
  // Paused indicator
  if (gameState.gamePhase === 'PAUSED') {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  }
}

function renderUI(p) {
  // Score
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Moves
  p.fill(gameState.movesRemaining < 10 ? [255, 100, 100] : [100, 255, 100]);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Moves: ${gameState.movesRemaining}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 10);
  
  // Objectives
  p.fill(220, 220, 220);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text('Objectives:', 10, 40);
  
  gameState.objectives.forEach((obj, i) => {
    const complete = obj.current >= obj.target;
    p.fill(...(complete ? [100, 255, 100] : [200, 200, 200]));
    const progress = complete ? '✓' : `${Math.min(obj.current, obj.target)}/${obj.target}`;
    p.text(`${obj.display}: ${progress}`, 10, 60 + i * 18);
  });
}

function renderBoard(p) {
  const size = gameState.board.length;
  
  // Board background
  p.fill(50, 40, 70);
  p.noStroke();
  p.rect(GRID_OFFSET_X - 5, GRID_OFFSET_Y - 5, 
         size * TILE_SIZE + 10, size * TILE_SIZE + 10, 8);
  
  // Grid
  p.stroke(70, 60, 90);
  p.strokeWeight(1);
  for (let i = 0; i <= size; i++) {
    p.line(GRID_OFFSET_X, GRID_OFFSET_Y + i * TILE_SIZE,
           GRID_OFFSET_X + size * TILE_SIZE, GRID_OFFSET_Y + i * TILE_SIZE);
    p.line(GRID_OFFSET_X + i * TILE_SIZE, GRID_OFFSET_Y,
           GRID_OFFSET_X + i * TILE_SIZE, GRID_OFFSET_Y + size * TILE_SIZE);
  }
  
  // Tiles
  gameState.entities.forEach(tile => {
    const isSelected = gameState.selectedTile === tile;
    const isCursor = tile.gridX === gameState.cursorX && tile.gridY === gameState.cursorY;
    tile.render(GRID_OFFSET_X, GRID_OFFSET_Y, isSelected, isCursor);
  });
}

export function renderGameOver(p) {
  p.background(20, 15, 35);
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'LEVEL COMPLETE!' : 'LEVEL FAILED!', CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(255, 215, 0);
  p.textSize(24);
  p.text(`Level Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  
  if (isWin) {
    // Bonus points
    const bonus = gameState.movesRemaining * 20;
    if (bonus > 0) {
      p.fill(200, 255, 200);
      p.textSize(18);
      p.text(`Moves Bonus: +${bonus}`, CANVAS_WIDTH / 2, 200);
    }
    
    // Next level info
    if (gameState.currentLevel < 5) {
      p.fill(200, 200, 255);
      p.textSize(16);
      p.text(`Next: Level ${gameState.currentLevel + 1}`, CANVAS_WIDTH / 2, 240);
    } else {
      p.fill(255, 215, 0);
      p.textSize(20);
      p.text('ALL LEVELS COMPLETE!', CANVAS_WIDTH / 2, 240);
      p.fill(200, 255, 200);
      p.textSize(18);
      p.text(`Total Score: ${gameState.totalScore + gameState.score}`, CANVAS_WIDTH / 2, 270);
    }
  } else {
    // Failed message
    p.fill(220, 220, 220);
    p.textSize(16);
    p.text('Try again!', CANVAS_WIDTH / 2, 200);
  }
  
  // Instructions
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 340);
}