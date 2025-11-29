import { GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, gameState } from './globals.js';

// Draw the game grid
export function drawGrid(p) {
  p.push();
  p.stroke(50);
  p.strokeWeight(1);
  p.fill(30);
  p.rect(GRID_OFFSET_X - 5, GRID_OFFSET_Y - 5, GRID_SIZE * CELL_SIZE + 10, GRID_SIZE * CELL_SIZE + 10);
  
  // Draw grid cells
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cellX = GRID_OFFSET_X + x * CELL_SIZE;
      const cellY = GRID_OFFSET_Y + y * CELL_SIZE;
      
      // Draw cell background
      p.stroke(50);
      p.strokeWeight(1);
      p.fill(40);
      p.rect(cellX, cellY, CELL_SIZE, CELL_SIZE);
      
      // Draw block if present
      if (gameState.grid[y][x] > 0) {
        const colorIndex = gameState.grid[y][x] - 1;
        p.fill(
          Math.min(255, colorIndex < 6 ? 30 + colorIndex * 40 : 255),
          Math.min(255, colorIndex < 6 ? 30 + (colorIndex + 2) % 6 * 40 : 100),
          Math.min(255, colorIndex < 6 ? 30 + (colorIndex + 4) % 6 * 40 : 100)
        );
        p.rect(cellX + 1, cellY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    }
  }
  p.pop();
}

// Draw the available blocks
export function drawAvailableBlocks(p) {
  p.push();
  p.textSize(16);
  p.fill(255);
  p.text("Available Blocks:", 430, 50);
  
  for (let i = 0; i < gameState.availableBlocks.length; i++) {
    const block = gameState.availableBlocks[i];
    const blockX = 450;
    const blockY = 70 + i * 80;
    
    // Highlight the selected block
    if (i === gameState.selectedBlockIndex) {
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
      p.noFill();
      p.rect(
        blockX - 5, 
        blockY - 5, 
        block.width * CELL_SIZE + 10, 
        block.height * CELL_SIZE + 10
      );
    }
    
    // Draw the block
    p.fill(block.color);
    for (let y = 0; y < block.height; y++) {
      for (let x = 0; x < block.width; x++) {
        if (block.shape[y][x] === 1) {
          p.rect(
            blockX + x * CELL_SIZE, 
            blockY + y * CELL_SIZE, 
            CELL_SIZE - 2, 
            CELL_SIZE - 2
          );
        }
      }
    }
  }
  p.pop();
}

// Draw the current block at its position on the grid
export function drawCurrentBlock(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const block = gameState.availableBlocks[gameState.selectedBlockIndex];
  const canPlace = canPlaceBlock(block, gameState.currentBlockX, gameState.currentBlockY);
  
  p.push();
  p.fill(block.color[0], block.color[1], block.color[2], canPlace ? 200 : 100);
  p.stroke(canPlace ? 255 : 255, 0, 0);
  p.strokeWeight(2);
  
  for (let y = 0; y < block.height; y++) {
    for (let x = 0; x < block.width; x++) {
      if (block.shape[y][x] === 1) {
        p.rect(
          GRID_OFFSET_X + (gameState.currentBlockX + x) * CELL_SIZE + 1,
          GRID_OFFSET_Y + (gameState.currentBlockY + y) * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
      }
    }
  }
  p.pop();
}

// Helper function to check if a block can be placed
function canPlaceBlock(block, x, y) {
  // Check if the block is within the grid boundaries
  if (x < 0 || y < 0 || x + block.width > GRID_SIZE || y + block.height > GRID_SIZE) {
    return false;
  }
  
  // Check if the block overlaps with any existing blocks
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      if (block.shape[i][j] === 1 && gameState.grid[y + i][x + j] !== 0) {
        return false;
      }
    }
  }
  
  return true;
}

// Draw the score
export function drawScore(p) {
  p.push();
  p.textSize(18);
  p.fill(255);
  p.text(`Score: ${gameState.score}`, 20, 30);
  p.text(`High Score: ${gameState.highScore}`, 20, 60);
  
  if (gameState.combo > 1) {
    p.fill(255, 255, 0);
    p.text(`Combo: x${gameState.combo}`, 20, 90);
  }
  
  if (gameState.lastClearedLines > 0 && p.frameCount - gameState.lastPlacedTime < 60) {
    p.fill(255, 200, 0);
    p.textSize(24);
    p.text(`+${gameState.lastClearedLines * gameState.combo * 100}`, 20, 120);
  }
  p.pop();
}

// Draw the start screen
export function drawStartScreen(p) {
  p.push();
  p.background(30);
  p.textSize(40);
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Block Blast!", p.width / 2, 100);
  
  p.textSize(20);
  p.fill(200);
  p.text("Place blocks to fill rows and columns", p.width / 2, 160);
  p.text("Clear lines to score points", p.width / 2, 190);
  p.text("Game over when no blocks can be placed", p.width / 2, 220);
  
  p.textSize(24);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER TO START", p.width / 2, 300);
  p.pop();
}

// Draw the pause screen
export function drawPauseScreen(p) {
  p.push();
  p.textSize(20);
  p.fill(255);
  p.text("PAUSED", 520, 30);
  p.pop();
}

// Draw the game over screen
export function drawGameOverScreen(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, p.width, p.height);
  
  p.textSize(40);
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Game Over!", p.width / 2, 150);
  
  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, p.width / 2, 200);
  
  if (gameState.score > gameState.highScore / 2) {
    p.fill(255, 255, 100);
    p.text("Great job!", p.width / 2, 240);
  }
  
  p.textSize(20);
  p.fill(200);
  p.text("PRESS R TO RESTART", p.width / 2, 300);
  p.pop();
}