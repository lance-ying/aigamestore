// Rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, BOARD_ROWS, BOARD_COLS, BOARD_OFFSET_X, BOARD_OFFSET_Y, PIECE_PREVIEW_X, PIECE_PREVIEW_Y, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 35, 50);
  
  // Title with gradient effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title shadow
  p.fill(0, 100);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("UBONGO", CANVAS_WIDTH / 2 + 3, 60 + 3);
  
  // Title
  p.fill(255, 200, 50);
  p.text("UBONGO", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.fill(150, 200, 255);
  p.text("Puzzle Challenge", CANVAS_WIDTH / 2, 95);
  
  // Instructions box
  p.fill(40, 45, 60);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rect(100, 130, 400, 190, 10);
  
  // Instructions
  p.noStroke();
  p.textSize(16);
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "Fill the highlighted area with all pieces",
    "",
    "CONTROLS:",
    "Arrow Keys - Move piece",
    "Space - Rotate piece",
    "Shift - Flip piece",
    "Z - Select next piece"
  ];
  
  let yPos = 145;
  for (const line of instructions) {
    if (line.includes("OBJECTIVE") || line.includes("CONTROLS")) {
      p.fill(255, 200, 50);
      p.textStyle(p.BOLD);
    } else if (line === "") {
      yPos += 5;
      continue;
    } else {
      p.fill(200, 220, 255);
      p.textStyle(p.NORMAL);
    }
    p.text(line, 120, yPos);
    yPos += 22;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  p.fill(...(flash ? [100, 255, 100] : [50, 200, 50]));
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}

export function renderBoard(p) {
  // Draw grid background
  p.push();
  p.fill(45, 50, 65);
  p.stroke(60, 65, 80);
  p.strokeWeight(1);
  p.rect(BOARD_OFFSET_X - 5, BOARD_OFFSET_Y - 5, BOARD_COLS * GRID_SIZE + 10, BOARD_ROWS * GRID_SIZE + 10, 5);
  
  // Draw grid cells
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const x = BOARD_OFFSET_X + col * GRID_SIZE;
      const y = BOARD_OFFSET_Y + row * GRID_SIZE;
      
      p.stroke(70, 75, 90);
      p.strokeWeight(1);
      p.fill(50, 55, 70);
      p.rect(x, y, GRID_SIZE, GRID_SIZE);
    }
  }
  p.pop();
}

export function renderTargetCells(p) {
  p.push();
  for (const cell of gameState.targetCells) {
    const x = BOARD_OFFSET_X + cell.x * GRID_SIZE;
    const y = BOARD_OFFSET_Y + cell.y * GRID_SIZE;
    
    // Pulsing effect
    const pulse = Math.sin(p.frameCount * 0.05) * 10 + 245;
    p.fill(255, 220, 100, 60);
    p.stroke(pulse, 200, 50);
    p.strokeWeight(2);
    p.rect(x, y, GRID_SIZE, GRID_SIZE);
  }
  p.pop();
}

export function renderPlacedPieces(p) {
  for (const piece of gameState.pieces) {
    if (piece.placed) {
      piece.draw(p, BOARD_OFFSET_X, BOARD_OFFSET_Y);
    }
  }
}

export function renderCurrentPiece(p) {
  const piece = gameState.pieces[gameState.selectedPieceIndex];
  if (!piece.placed) {
    const alpha = Math.sin(p.frameCount * 0.1) * 30 + 200;
    piece.draw(p, BOARD_OFFSET_X, BOARD_OFFSET_Y, alpha);
  }
}

export function renderPiecePreview(p) {
  p.push();
  
  // Preview box
  p.fill(40, 45, 60);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rect(PIECE_PREVIEW_X - 10, PIECE_PREVIEW_Y - 40, 140, 220, 5);
  
  // Title
  p.fill(255, 200, 50);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.textStyle(p.BOLD);
  p.text("PIECES", PIECE_PREVIEW_X + 60, PIECE_PREVIEW_Y - 30);
  
  // Draw all pieces
  let yOffset = 0;
  for (let i = 0; i < gameState.pieces.length; i++) {
    const piece = gameState.pieces[i];
    const isSelected = i === gameState.selectedPieceIndex;
    
    p.push();
    p.translate(PIECE_PREVIEW_X, PIECE_PREVIEW_Y + yOffset);
    
    // Highlight selected piece
    if (isSelected && !piece.placed) {
      p.fill(100, 255, 100, 50);
      p.noStroke();
      p.rect(-5, -5, 130, 35, 3);
    }
    
    // Draw piece preview (small scale)
    const scale = 0.6;
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col] === 1) {
          const x = col * GRID_SIZE * scale;
          const y = row * GRID_SIZE * scale;
          
          const alpha = piece.placed ? 100 : 255;
          p.fill(...piece.color, alpha);
          p.stroke(0, alpha);
          p.strokeWeight(1);
          p.rect(x, y, GRID_SIZE * scale, GRID_SIZE * scale);
        }
      }
    }
    
    // Placed indicator
    if (piece.placed) {
      p.fill(100, 255, 100);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text("✓", 120, 10);
    }
    
    p.pop();
    yOffset += 40;
  }
  
  p.pop();
}

export function renderUI(p) {
  p.push();
  
  // Top bar background
  p.fill(30, 35, 50);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 70);
  
  // Level
  p.fill(255, 200, 50);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL ${gameState.level}`, 20, 15);
  
  // Gems
  p.fill(150, 255, 255);
  p.textSize(16);
  p.text(`💎 ${gameState.gems}`, 20, 40);
  
  // Timer
  const timeLeft = Math.max(0, gameState.timeLimit - gameState.elapsedTime);
  const seconds = Math.ceil(timeLeft / 1000);
  const timerColor = seconds < 20 ? [255, 100, 100] : [150, 255, 150];
  p.fill(...timerColor);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text(`⏱ ${seconds}s`, CANVAS_WIDTH / 2, 20);
  
  p.pop();
}

export function renderPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH - 20, 20);
  p.pop();
}

export function renderGameOverScreen(p, won) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result box
  p.fill(40, 45, 60);
  p.stroke(100, 150, 200);
  p.strokeWeight(3);
  p.rect(100, 100, 400, 200, 10);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.textStyle(p.BOLD);
  p.noStroke();
  
  if (won) {
    p.fill(100, 255, 100);
    p.text("PUZZLE SOLVED!", CANVAS_WIDTH / 2, 150);
    
    // Time and gems
    p.textSize(20);
    p.fill(255, 255, 255);
    const timeSeconds = Math.floor(gameState.elapsedTime / 1000);
    p.text(`Time: ${timeSeconds}s`, CANVAS_WIDTH / 2, 195);
    
    p.fill(150, 255, 255);
    p.text(`💎 Gems Earned: +${gameState.score}`, CANVAS_WIDTH / 2, 225);
  } else {
    p.fill(255, 100, 100);
    p.text("TIME'S UP!", CANVAS_WIDTH / 2, 170);
    
    p.textSize(18);
    p.fill(200, 200, 200);
    p.text("Try again!", CANVAS_WIDTH / 2, 210);
  }
  
  // Restart prompt
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.fill(150, 200, 255);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 260);
  
  p.pop();
}

export function renderPlayingScreen(p) {
  p.background(30, 35, 50);
  
  renderUI(p);
  renderBoard(p);
  renderTargetCells(p);
  renderPlacedPieces(p);
  renderCurrentPiece(p);
  renderPiecePreview(p);
  
  if (gameState.gamePhase === "PAUSED") {
    renderPausedOverlay(p);
  }
}