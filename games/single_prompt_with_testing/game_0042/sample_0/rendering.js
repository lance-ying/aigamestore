// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, BOX_SIZE } from './globals.js';

const GRID_OFFSET_X = 50;
const GRID_OFFSET_Y = 50;
const CELL_SIZE = 32;
const GRID_WIDTH = CELL_SIZE * GRID_SIZE;

export function drawStartScreen(p) {
  p.background(240, 240, 250);
  
  // Title
  p.fill(40, 60, 120);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("Sven's SudokuPad", CANVAS_WIDTH / 2, 60);
  
  // Description
  p.textSize(14);
  p.fill(60, 60, 80);
  const desc = "Fill the 9×9 grid with digits 1-9 so that each row,\ncolumn, and 3×3 box contains all digits exactly once.";
  p.text(desc, CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(40, 40, 60);
  const instructions = [
    "CONTROLS:",
    "• Arrow Keys: Move selection",
    "• 1-9: Enter digit (solution) or toggle pencil mark",
    "• Space: Toggle solution/pencil mode",
    "• Shift: Clear selected cell",
    "• Z: Undo last move",
    "• ESC: Pause game",
    "• R: Return to start screen"
  ];
  
  let yPos = 180;
  for (const line of instructions) {
    p.text(line, 120, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(100, 150, 220);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 150 * pulse, 220);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawPlayingScreen(p) {
  p.background(245, 245, 250);
  
  // Draw grid
  drawGrid(p);
  
  // Draw UI elements
  drawUI(p);
  
  // Draw paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(220, 60, 60);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawGrid(p) {
  p.push();
  p.translate(GRID_OFFSET_X, GRID_OFFSET_Y);
  
  // Draw cells
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = gameState.grid[row][col];
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      
      // Cell background
      if (row === gameState.selectedRow && col === gameState.selectedCol) {
        p.fill(180, 200, 255); // Selected cell
      } else if (row === gameState.selectedRow || col === gameState.selectedCol) {
        p.fill(230, 235, 245); // Same row/col as selected
      } else if (Math.floor(row / BOX_SIZE) % 2 === Math.floor(col / BOX_SIZE) % 2) {
        p.fill(255, 255, 255);
      } else {
        p.fill(248, 248, 252);
      }
      p.noStroke();
      p.rect(x, y, CELL_SIZE, CELL_SIZE);
      
      // Draw cell value or pencil marks
      if (cell.value !== 0) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        
        if (cell.given) {
          p.fill(20, 20, 40);
        } else if (cell.isError) {
          p.fill(220, 40, 40);
        } else {
          p.fill(60, 100, 180);
        }
        
        p.text(cell.value, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      } else if (cell.pencilMarks.size > 0) {
        // Draw pencil marks
        p.textSize(8);
        p.fill(120, 120, 140);
        const marks = Array.from(cell.pencilMarks).sort();
        for (const mark of marks) {
          const markRow = Math.floor((mark - 1) / 3);
          const markCol = (mark - 1) % 3;
          const markX = x + markCol * (CELL_SIZE / 3) + CELL_SIZE / 6;
          const markY = y + markRow * (CELL_SIZE / 3) + CELL_SIZE / 6;
          p.textAlign(p.CENTER, p.CENTER);
          p.text(mark, markX, markY);
        }
      }
    }
  }
  
  // Draw grid lines
  p.stroke(180, 180, 190);
  p.strokeWeight(1);
  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * CELL_SIZE;
    p.line(0, pos, GRID_WIDTH, pos);
    p.line(pos, 0, pos, GRID_WIDTH);
  }
  
  // Draw box lines (thicker)
  p.stroke(80, 80, 100);
  p.strokeWeight(3);
  for (let i = 0; i <= GRID_SIZE; i += BOX_SIZE) {
    const pos = i * CELL_SIZE;
    p.line(0, pos, GRID_WIDTH, pos);
    p.line(pos, 0, pos, GRID_WIDTH);
  }
  
  p.pop();
}

function drawUI(p) {
  // Mode indicator
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(40, 40, 60);
  p.text(`Mode: ${gameState.inputMode}`, 400, 60);
  
  // Progress
  const progress = gameState.totalEmptyCells > 0 
    ? Math.round((gameState.completedCells / gameState.totalEmptyCells) * 100) 
    : 100;
  p.text(`Progress: ${progress}%`, 400, 85);
  
  // Completed cells
  p.text(`Cells: ${gameState.completedCells}/${gameState.totalEmptyCells}`, 400, 110);
  
  // Instructions reminder
  p.textSize(10);
  p.fill(100, 100, 120);
  p.text("Space: Toggle mode", 400, 140);
  p.text("Shift: Clear cell", 400, 155);
  p.text("Z: Undo", 400, 170);
  p.text("ESC: Pause", 400, 185);
}

export function drawGameOverScreen(p) {
  p.background(240, 245, 250);
  
  // Draw final grid
  drawGrid(p);
  
  // Semi-transparent overlay
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Win message
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(40, 180, 80);
    p.text("PUZZLE COMPLETE!", CANVAS_WIDTH / 2, 140);
    
    p.textSize(20);
    p.fill(60, 60, 80);
    p.text(`Completed in ${gameState.moveHistory.length} moves`, CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(220, 60, 60);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 160);
  }
  
  // Restart prompt
  p.textSize(18);
  p.fill(100, 120, 200);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 120 * pulse, 200);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
}