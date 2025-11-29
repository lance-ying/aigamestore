// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYFIELD_X, PLAYFIELD_Y, GRID_COLS, GRID_ROWS, CELL_SIZE } from './globals.js';
import { getGhostPosition } from './tetromino.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("BRICK BREAK", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Classic Tetris-Style Puzzle", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "HOW TO PLAY:",
    "• Stack falling blocks to create complete lines",
    "• Complete lines disappear and award points",
    "• Game speeds up as you progress",
    "• Don't let blocks reach the top!",
    "",
    "CONTROLS:",
    "• LEFT/RIGHT or A/D: Move piece",
    "• UP/W/SPACE: Rotate piece",
    "• DOWN/S: Soft drop",
    "• SHIFT: Hard drop",
    "• ESC: Pause"
  ];
  
  let y = 170;
  for (let line of instructions) {
    if (line.startsWith("•")) {
      p.fill(200, 200, 200);
    } else {
      p.fill(255, 255, 100);
    }
    p.text(line, 100, y);
    y += 20;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function renderGame(p) {
  p.background(20, 20, 40);
  
  // Draw playfield border
  p.stroke(100, 100, 150);
  p.strokeWeight(3);
  p.noFill();
  p.rect(PLAYFIELD_X - 2, PLAYFIELD_Y - 2, GRID_COLS * CELL_SIZE + 4, GRID_ROWS * CELL_SIZE + 4);
  
  // Draw playfield background
  p.fill(30, 30, 50);
  p.noStroke();
  p.rect(PLAYFIELD_X, PLAYFIELD_Y, GRID_COLS * CELL_SIZE, GRID_ROWS * CELL_SIZE);
  
  // Draw grid lines
  p.stroke(40, 40, 60);
  p.strokeWeight(1);
  for (let col = 0; col <= GRID_COLS; col++) {
    const x = PLAYFIELD_X + col * CELL_SIZE;
    p.line(x, PLAYFIELD_Y, x, PLAYFIELD_Y + GRID_ROWS * CELL_SIZE);
  }
  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = PLAYFIELD_Y + row * CELL_SIZE;
    p.line(PLAYFIELD_X, y, PLAYFIELD_X + GRID_COLS * CELL_SIZE, y);
  }
  
  // Draw placed blocks
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (gameState.grid[row][col] !== 0) {
        drawBlock(p, col, row, gameState.grid[row][col], 1.0);
      }
    }
  }
  
  // Draw ghost piece
  if (gameState.currentPiece) {
    const ghost = getGhostPosition();
    if (ghost) {
      for (let [dx, dy] of gameState.currentPiece) {
        const gridX = ghost.x + dx;
        const gridY = ghost.y + dy;
        if (gridY >= 0 && gridY < GRID_ROWS) {
          drawBlock(p, gridX, gridY, gameState.currentColor, 0.2);
        }
      }
    }
  }
  
  // Draw current piece
  if (gameState.currentPiece) {
    for (let [dx, dy] of gameState.currentPiece) {
      const gridX = gameState.pieceX + dx;
      const gridY = gameState.pieceY + dy;
      if (gridY >= 0 && gridY < GRID_ROWS) {
        drawBlock(p, gridX, gridY, gameState.currentColor, 1.0);
      }
    }
  }
  
  // Draw clearing animation
  if (gameState.clearingLines.length > 0) {
    const elapsed = Date.now() - gameState.clearAnimationTimer;
    const progress = elapsed / gameState.clearAnimationDuration;
    
    for (let row of gameState.clearingLines) {
      p.noStroke();
      p.fill(255, 255, 255, 200 * (1 - progress));
      const y = PLAYFIELD_Y + row * CELL_SIZE;
      p.rect(PLAYFIELD_X, y, GRID_COLS * CELL_SIZE, CELL_SIZE);
    }
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw next piece preview
  drawNextPiece(p);
}

function drawBlock(p, gridX, gridY, color, alpha) {
  const x = PLAYFIELD_X + gridX * CELL_SIZE;
  const y = PLAYFIELD_Y + gridY * CELL_SIZE;
  
  p.noStroke();
  p.fill(color[0] * alpha, color[1] * alpha, color[2] * alpha);
  p.rect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  
  // Highlight
  p.fill(255, 255, 255, 50 * alpha);
  p.rect(x + 2, y + 2, CELL_SIZE - 8, CELL_SIZE - 8);
}

function drawUI(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  
  const uiX = 30;
  let uiY = 50;
  
  p.text("SCORE", uiX, uiY);
  p.textStyle(p.NORMAL);
  p.text(gameState.score, uiX, uiY + 25);
  
  uiY += 70;
  p.textStyle(p.BOLD);
  p.text("LINES", uiX, uiY);
  p.textStyle(p.NORMAL);
  p.text(gameState.linesCleared, uiX, uiY + 25);
  
  uiY += 70;
  p.textStyle(p.BOLD);
  p.text("LEVEL", uiX, uiY);
  p.textStyle(p.NORMAL);
  p.text(gameState.level, uiX, uiY + 25);
}

function drawNextPiece(p) {
  const previewX = 460;
  const previewY = 50;
  const previewSize = 100;
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text("NEXT", previewX, previewY);
  
  // Draw preview box
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.noFill();
  p.rect(previewX, previewY + 30, previewSize, previewSize);
  
  p.fill(30, 30, 50);
  p.noStroke();
  p.rect(previewX + 2, previewY + 32, previewSize - 4, previewSize - 4);
  
  // Draw next piece
  if (gameState.nextShape) {
    const shapes = {
      I: [[0, -1], [0, 0], [0, 1], [0, 2]],
      O: [[0, 0], [1, 0], [0, 1], [1, 1]],
      T: [[-1, 0], [0, 0], [1, 0], [0, 1]],
      S: [[-1, 1], [0, 1], [0, 0], [1, 0]],
      Z: [[-1, 0], [0, 0], [0, 1], [1, 1]],
      J: [[-1, 0], [0, 0], [1, 0], [-1, 1]],
      L: [[-1, 0], [0, 0], [1, 0], [1, 1]]
    };
    
    const piece = shapes[gameState.nextShape];
    const centerX = previewX + previewSize / 2;
    const centerY = previewY + 30 + previewSize / 2;
    const blockSize = 14;
    
    p.noStroke();
    for (let [dx, dy] of piece) {
      const x = centerX + dx * blockSize;
      const y = centerY + dy * blockSize;
      
      p.fill(gameState.nextColor[0], gameState.nextColor[1], gameState.nextColor[2]);
      p.rect(x - blockSize / 2 + 1, y - blockSize / 2 + 1, blockSize - 2, blockSize - 2);
      
      p.fill(255, 255, 255, 50);
      p.rect(x - blockSize / 2 + 2, y - blockSize / 2 + 2, blockSize - 6, blockSize - 6);
    }
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, 170);
  p.text("Lines Cleared: " + gameState.linesCleared, CANVAS_WIDTH / 2, 210);
  p.text("Level Reached: " + gameState.level, CANVAS_WIDTH / 2, 250);
  
  p.fill(100, 200, 255);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  }
}