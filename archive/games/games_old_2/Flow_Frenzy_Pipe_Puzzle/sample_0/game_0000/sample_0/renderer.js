// renderer.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, PIPE_TYPES, CELL_SIZE } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.fill(100, 180, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text("FLOW FRENZY", CANVAS_WIDTH / 2, 80);
  
  p.textSize(28);
  p.fill(150, 200, 255);
  p.text("Pipe Puzzle", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.textSize(14);
  p.fill(200, 220, 240);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Connect pipes from source to cup!\nRotate pieces to create a path.";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(13);
  p.fill(180, 200, 220);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Arrow Keys - Move cursor",
    "Space - Rotate clockwise",
    "Shift - Rotate counter-clockwise",
    "Z - Release water",
    "Esc - Pause",
    "R - Restart to menu"
  ];
  
  let yPos = 220;
  for (const inst of instructions) {
    p.text(inst, 150, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(30, 20, 20);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "ALL LEVELS COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.textSize(24);
  p.fill(220);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (!isWin) {
    p.textSize(18);
    p.fill(180);
    p.text("Time ran out or path was broken", CANVAS_WIDTH / 2, 220);
  }
  
  p.textSize(20);
  p.fill(255, 220, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function renderLevelCompleteScreen(p) {
  p.background(20, 40, 30);
  
  p.fill(100, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 120);
  
  const timeBonus = Math.floor(gameState.timeRemaining * 10);
  
  p.textSize(20);
  p.fill(220);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Time Bonus: +${timeBonus}`, CANVAS_WIDTH / 2, 210);
  
  if (gameState.currentLevel < gameState.maxLevel) {
    p.textSize(20);
    p.fill(255, 220, 100);
    p.text("PRESS Z FOR NEXT LEVEL", CANVAS_WIDTH / 2, 320);
  } else {
    p.textSize(20);
    p.fill(255, 220, 100);
    p.text("PRESS Z TO FINISH", CANVAS_WIDTH / 2, 320);
  }
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 10);
  
  // Time
  p.textAlign(p.CENTER, p.TOP);
  const timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH / 2, 10);
}

export function renderGrid(p) {
  const { grid, gridWidth, gridHeight, cursorX, cursorY } = gameState;
  
  const gridPixelWidth = gridWidth * CELL_SIZE;
  const gridPixelHeight = gridHeight * CELL_SIZE;
  const offsetX = (CANVAS_WIDTH - gridPixelWidth) / 2;
  const offsetY = (CANVAS_HEIGHT - gridPixelHeight) / 2 + 20;
  
  // Draw grid background
  p.fill(40, 45, 50);
  p.noStroke();
  p.rect(offsetX - 5, offsetY - 5, gridPixelWidth + 10, gridPixelHeight + 10);
  
  // Draw grid cells
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const px = offsetX + x * CELL_SIZE;
      const py = offsetY + y * CELL_SIZE;
      
      // Cell background
      p.fill(30, 35, 40);
      p.stroke(50, 55, 60);
      p.strokeWeight(1);
      p.rect(px, py, CELL_SIZE, CELL_SIZE);
      
      // Draw pipe
      if (grid[y] && grid[y][x]) {
        drawPipe(p, grid[y][x], px, py);
      }
      
      // Draw cursor
      if (x === cursorX && y === cursorY && gameState.gamePhase === GAME_PHASES.PLAYING) {
        p.noFill();
        p.stroke(255, 200, 0);
        p.strokeWeight(3);
        p.rect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }
    }
  }
}

function drawPipe(p, pipe, x, y) {
  p.push();
  p.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
  p.rotate(p.radians(pipe.rotation));
  
  const pipeWidth = 12;
  
  switch (pipe.type) {
    case PIPE_TYPES.STRAIGHT:
      p.fill(120, 120, 120);
      p.noStroke();
      p.rect(-pipeWidth / 2, -CELL_SIZE / 2, pipeWidth, CELL_SIZE);
      break;
      
    case PIPE_TYPES.BEND:
      p.fill(120, 120, 120);
      p.noStroke();
      p.rect(-pipeWidth / 2, -CELL_SIZE / 2, pipeWidth, CELL_SIZE / 2 + pipeWidth / 2);
      p.rect(-pipeWidth / 2, -pipeWidth / 2, CELL_SIZE / 2 + pipeWidth / 2, pipeWidth);
      break;
      
    case PIPE_TYPES.T_JUNCTION:
      p.fill(120, 120, 120);
      p.noStroke();
      p.rect(-pipeWidth / 2, -CELL_SIZE / 2, pipeWidth, CELL_SIZE);
      p.rect(-pipeWidth / 2, -pipeWidth / 2, CELL_SIZE / 2 + pipeWidth / 2, pipeWidth);
      break;
      
    case PIPE_TYPES.CROSS:
      p.fill(120, 120, 120);
      p.noStroke();
      p.rect(-pipeWidth / 2, -CELL_SIZE / 2, pipeWidth, CELL_SIZE);
      p.rect(-CELL_SIZE / 2, -pipeWidth / 2, CELL_SIZE, pipeWidth);
      break;
      
    case PIPE_TYPES.START:
      p.fill(50, 120, 200);
      p.noStroke();
      p.ellipse(0, 0, 30, 30);
      p.fill(100, 150, 220);
      p.rect(-pipeWidth / 2, -pipeWidth / 2, CELL_SIZE / 2 + pipeWidth / 2, pipeWidth);
      break;
      
    case PIPE_TYPES.END:
      p.fill(50, 150, 255);
      p.noStroke();
      // Cup shape
      p.quad(-15, -10, 15, -10, 12, 10, -12, 10);
      p.rect(-12, 10, 24, 3);
      break;
      
    case PIPE_TYPES.BLOCKED:
      p.fill(80, 60, 50);
      p.noStroke();
      // Rock shape
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 + 30) * (Math.PI / 180);
        const radius = 18 + (i % 2) * 5;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) {
          p.beginShape();
        }
        p.vertex(px, py);
        if (i === 5) {
          p.endShape(p.CLOSE);
        }
      }
      break;
  }
  
  p.pop();
}

export function renderWaterFlow(p) {
  const { waterPath, waterAnimProgress, grid } = gameState;
  
  if (waterPath.length === 0) return;
  
  const gridPixelWidth = gameState.gridWidth * CELL_SIZE;
  const gridPixelHeight = gameState.gridHeight * CELL_SIZE;
  const offsetX = (CANVAS_WIDTH - gridPixelWidth) / 2;
  const offsetY = (CANVAS_HEIGHT - gridPixelHeight) / 2 + 20;
  
  const segmentsToShow = Math.floor(waterAnimProgress * waterPath.length);
  
  for (let i = 0; i <= segmentsToShow && i < waterPath.length; i++) {
    const pos = waterPath[i];
    const px = offsetX + pos.x * CELL_SIZE + CELL_SIZE / 2;
    const py = offsetY + pos.y * CELL_SIZE + CELL_SIZE / 2;
    
    p.fill(100, 180, 255, 200);
    p.noStroke();
    p.ellipse(px, py, 20, 20);
  }
  
  // Fill end cup if complete
  if (segmentsToShow >= waterPath.length - 1) {
    const endPos = waterPath[waterPath.length - 1];
    const px = offsetX + endPos.x * CELL_SIZE + CELL_SIZE / 2;
    const py = offsetY + endPos.y * CELL_SIZE + CELL_SIZE / 2;
    
    const fillAmount = Math.min(1, (waterAnimProgress * waterPath.length - waterPath.length + 1) * 3);
    
    p.fill(100, 180, 255, 150);
    const fillHeight = fillAmount * 15;
    p.rect(px - 10, py + 10 - fillHeight, 20, fillHeight);
  }
}