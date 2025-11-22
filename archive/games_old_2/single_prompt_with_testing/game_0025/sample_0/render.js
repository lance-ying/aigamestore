import { gameState, GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  p.background(40, 40, 50);
  
  if (gameState.gamePhase === "START") {
    renderStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
    renderPlayingScreen(p);
    if (gameState.gamePhase === "PAUSED") {
      renderPauseIndicator(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("マインスイーパQ", CANVAS_WIDTH / 2, 80);
  
  p.textSize(18);
  p.fill(200, 200, 200);
  p.text("Minesweeper Q Premium", CANVAS_WIDTH / 2, 115);
  
  p.textSize(14);
  p.fill(180, 180, 180);
  const instructions = [
    "Uncover all safe squares without hitting mines!",
    "",
    "Each number shows how many mines are adjacent.",
    "Use logic to deduce safe squares and mine locations.",
    "",
    "Controls:",
    "Arrow Keys - Move cursor",
    "Space - Reveal square / Quick-open",
    "Z - Place/remove flag",
    "Shift - Toggle Quick Flag mode",
    "",
    "PRESS ENTER TO START"
  ];
  
  let y = 150;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 18;
  }
}

function renderPlayingScreen(p) {
  renderUI(p);
  renderGrid(p);
  renderCursor(p);
}

function renderUI(p) {
  // Top bar
  p.fill(60, 60, 70);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Mine counter
  p.fill(255, 100, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Mines: ${GAME_CONFIG.mines - gameState.flagCount}`, 20, 20);
  
  // Timer
  let displayTime = gameState.elapsedTime;
  if (gameState.gamePhase === "PLAYING" && !gameState.firstClick) {
    displayTime = Math.floor((Date.now() - gameState.startTime) / 1000);
  }
  p.fill(100, 200, 255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Time: ${displayTime}s`, CANVAS_WIDTH - 20, 20);
  
  // Mode indicator
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  const mode = gameState.quickFlagMode ? "Quick Flag Mode" : "Standard Mode";
  p.text(mode, CANVAS_WIDTH / 2, 40);
}

function renderGrid(p) {
  const { rows, cols, cellSize, gridOffsetX, gridOffsetY } = GAME_CONFIG;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = gameState.grid[row][col];
      const x = gridOffsetX + col * cellSize;
      const y = gridOffsetY + row * cellSize;
      
      // Cell background
      if (cell.revealed) {
        p.fill(...(cell.isMine ? [200, 50, 50] : [220, 220, 220]));
      } else {
        p.fill(100, 100, 120);
      }
      p.stroke(60, 60, 70);
      p.strokeWeight(1);
      p.rect(x, y, cellSize, cellSize);
      
      // Cell content
      if (cell.revealed) {
        if (cell.isMine) {
          // Draw mine
          p.fill(40, 40, 40);
          p.noStroke();
          p.circle(x + cellSize / 2, y + cellSize / 2, cellSize * 0.5);
          p.fill(255, 0, 0);
          p.circle(x + cellSize / 2, y + cellSize / 2, cellSize * 0.3);
        } else if (cell.adjacentMines > 0) {
          // Draw number
          const colors = [
            [0, 0, 0],      // 0 - not used
            [0, 0, 255],    // 1 - blue
            [0, 150, 0],    // 2 - green
            [255, 0, 0],    // 3 - red
            [0, 0, 150],    // 4 - dark blue
            [150, 0, 0],    // 5 - dark red
            [0, 150, 150],  // 6 - cyan
            [0, 0, 0],      // 7 - black
            [100, 100, 100] // 8 - gray
          ];
          p.fill(...colors[cell.adjacentMines]);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(18);
          p.text(cell.adjacentMines, x + cellSize / 2, y + cellSize / 2);
        }
      } else if (cell.flagged) {
        // Draw flag
        p.fill(255, 200, 0);
        p.noStroke();
        p.triangle(
          x + cellSize * 0.3, y + cellSize * 0.25,
          x + cellSize * 0.3, y + cellSize * 0.65,
          x + cellSize * 0.7, y + cellSize * 0.45
        );
        p.stroke(255, 200, 0);
        p.strokeWeight(2);
        p.line(x + cellSize * 0.3, y + cellSize * 0.25, x + cellSize * 0.3, y + cellSize * 0.75);
      }
    }
  }
}

function renderCursor(p) {
  const { cellSize, gridOffsetX, gridOffsetY } = GAME_CONFIG;
  const x = gridOffsetX + gameState.cursorX * cellSize;
  const y = gridOffsetY + gameState.cursorY * cellSize;
  
  p.noFill();
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  p.rect(x, y, cellSize, cellSize);
}

function renderPauseIndicator(p) {
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  renderPlayingScreen(p);
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over message
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 150);
    
    p.fill(255, 255, 255);
    p.textSize(24);
    p.text(`Time: ${gameState.elapsedTime} seconds`, CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 180);
  }
  
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
}