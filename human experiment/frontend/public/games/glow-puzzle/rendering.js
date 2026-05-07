// Rendering functions
import { gameState } from './globals.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_PADDING, DOT_RADIUS, LINE_WIDTH, GLOW_INTENSITY } from './globals.js';
import { getDotPosition } from './puzzles.js';

// Color Palette
const COLORS = {
  bg: [5, 5, 16],
  grid: [20, 20, 40],
  dotInactive: [40, 40, 60],
  dotActive: [0, 255, 255], // Cyan
  dotStart: [100, 255, 100], // Green
  dotEnd: [255, 200, 50], // Orange
  lineInactive: [20, 30, 50],
  lineActive: [255, 0, 255], // Magenta
  cursor: [255, 255, 255],
  text: [200, 220, 255]
};

export function renderStartScreen(p) {
  p.background(COLORS.bg);
  drawBackgroundGrid(p);

  p.push();
  p.textAlign(p.CENTER, p.CENTER);

  // Title with neon glow
  p.drawingContext.shadowBlur = 30;
  p.drawingContext.shadowColor = p.color(0, 255, 255);
  p.fill(200, 255, 255);
  p.textSize(56);
  // REMOVED GAME NAME, REPLACED WITH "press enter to begin"
  p.text("press enter to begin", CANVAS_WIDTH / 2, 80);

  p.drawingContext.shadowBlur = 0; // Reset

  // Instructions - PRESERVED as they do not contain the game name
  p.fill(COLORS.text);
  p.textSize(16);
  p.text("Connect all glowing dots with a continuous path.", CANVAS_WIDTH / 2, 150);
  p.text("Visit every connection exactly once.", CANVAS_WIDTH / 2, 175);

  p.fill(150, 180, 220);
  p.textSize(14);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 230);
  p.fill(120, 150, 190);
  p.textSize(12);
  p.text("Arrows: Move | Space: Connect | Shift: Undo | Z: Reset", CANVAS_WIDTH / 2, 260);

  // Start prompt - PRESERVED as it does not contain the game name
  const pulse = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.drawingContext.shadowBlur = 15;
  p.drawingContext.shadowColor = p.color(255, 255, 0);
  p.fill(255, 255, 100, pulse);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);

  p.pop();
}

function drawBackgroundGrid(p) {
  p.push();
  p.stroke(COLORS.grid);
  p.strokeWeight(1);
  for(let x = 0; x <= CANVAS_WIDTH; x += 30) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for(let y = 0; y <= CANVAS_HEIGHT; y += 30) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  p.pop();
}

export function renderPlaying(p) {
  p.background(COLORS.bg);
  drawBackgroundGrid(p);

  if (!gameState.puzzleData) return;

  const { rows, cols } = gameState.puzzleData;
  const gridWidth = CANVAS_WIDTH - GRID_PADDING * 2;
  const gridHeight = CANVAS_HEIGHT - GRID_PADDING * 2 - 40;
  const offsetX = GRID_PADDING;
  const offsetY = GRID_PADDING + 20;

  // Draw puzzle elements
  drawConnections(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
  drawPath(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
  drawDots(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY);

  drawUI(p);

  if (gameState.puzzleComplete) {
    drawPuzzleCompleteOverlay(p);
  }
}

function drawConnections(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY) {
  const connections = gameState.puzzleData.connections;

  p.strokeCap(p.ROUND);

  for (const [dot1, dot2] of connections) {
    const pos1 = getDotPosition(dot1, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
    const pos2 = getDotPosition(dot2, rows, cols, gridWidth, gridHeight, offsetX, offsetY);

    const connKey = `${Math.min(dot1, dot2)}-${Math.max(dot1, dot2)}`;
    const isCompleted = gameState.completedConnections.has(connKey);

    if (isCompleted) {
      // Completed connection - drawn in drawPath, but we draw a base here
      p.stroke(COLORS.lineInactive);
      p.strokeWeight(LINE_WIDTH);
      p.line(pos1.x, pos1.y, pos2.x, pos2.y);
    } else {
      // Uncompleted connection - dim line
      p.stroke(COLORS.lineInactive);
      p.strokeWeight(LINE_WIDTH);
      p.line(pos1.x, pos1.y, pos2.x, pos2.y);
    }
  }
}

function drawPath(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY) {
  if (gameState.currentPath.length < 2) return;

  p.strokeCap(p.ROUND);

  // Use drawingContext for neon glow
  p.drawingContext.shadowBlur = 15;
  p.drawingContext.shadowColor = p.color(COLORS.lineActive);

  p.stroke(COLORS.lineActive);
  p.strokeWeight(LINE_WIDTH + 2);
  p.noFill();

  p.beginShape();
  for (let i = 0; i < gameState.currentPath.length; i++) {
    const dot = gameState.currentPath[i];
    const pos = getDotPosition(dot, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
    p.vertex(pos.x, pos.y);
  }
  p.endShape();

  p.drawingContext.shadowBlur = 0; // Reset
}

function drawDots(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY) {
  const totalDots = rows * cols;

  for (let i = 0; i < totalDots; i++) {
    const pos = getDotPosition(i, rows, cols, gridWidth, gridHeight, offsetX, offsetY);

    const isInPath = gameState.currentPath.includes(i);
    const isStart = gameState.currentPath.length > 0 && gameState.currentPath[0] === i;
    const isEnd = gameState.currentPath.length > 0 && gameState.currentPath[gameState.currentPath.length - 1] === i;
    const isCursor = gameState.cursorPosition.row === pos.row && gameState.cursorPosition.col === pos.col;

    // Determine color and size
    let dotColor = COLORS.dotInactive;
    let size = DOT_RADIUS * 2;
    let glowColor = null;

    if (isStart) {
      dotColor = COLORS.dotStart;
      glowColor = COLORS.dotStart;
      size += 4;
    } else if (isEnd) {
      dotColor = COLORS.dotEnd;
      glowColor = COLORS.dotEnd;
      size += 4;
    } else if (isInPath) {
      dotColor = COLORS.dotActive;
      glowColor = COLORS.dotActive;
    }

    if (isCursor) {
      size += Math.sin(p.frameCount * 0.2) * 4;
      if (!glowColor) glowColor = COLORS.cursor;
    }

    // Draw Glow
    if (glowColor || isCursor) {
      p.drawingContext.shadowBlur = isCursor ? 20 : 15;
      p.drawingContext.shadowColor = p.color(isCursor ? COLORS.cursor : glowColor);
    }

    p.noStroke();
    p.fill(isCursor ? COLORS.cursor : dotColor);
    p.circle(pos.x, pos.y, size);

    p.drawingContext.shadowBlur = 0; // Reset
  }
}

function drawPuzzleCompleteOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);

  const pulse = 1 + Math.sin(p.frameCount * 0.1) * 0.05;

  p.drawingContext.shadowBlur = 30;
  p.drawingContext.shadowColor = p.color(0, 255, 255);

  p.fill(200, 255, 255);
  p.textSize(40 * pulse);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  p.drawingContext.shadowBlur = 0;

  p.fill(255, 255, 150);
  p.textSize(20);
  p.text(`+${100 * (gameState.currentPuzzle + 1)} Points`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

  p.pop();
}

function drawUI(p) {
  p.push();
  p.fill(COLORS.text);
  p.noStroke();
  p.textSize(14);

  // Top Bar
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL ${gameState.currentPuzzle + 1}/${gameState.totalPuzzles}`, 20, 15);

  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 15);

  // Progress
  const progress = gameState.completedConnections.size / gameState.requiredConnections.size;
  const barWidth = 100;
  const barHeight = 6;

  p.textAlign(p.LEFT, p.TOP);
  p.text("PROGRESS", 20, 35);

  // Progress Bar Background
  p.fill(30, 30, 50);
  p.rect(100, 38, barWidth, barHeight, 3);

  // Progress Bar Fill
  if (gameState.completedConnections.size > 0) {
    p.fill(COLORS.dotActive);
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = p.color(COLORS.dotActive);
    p.rect(100, 38, barWidth * progress, barHeight, 3);
    p.drawingContext.shadowBlur = 0;
  }

  p.pop();
}

export function renderGameOver(p) {
  p.background(COLORS.bg);
  drawBackgroundGrid(p);

  const isWin = gameState.gamePhase === "GAME_OVER_WIN";

  p.push();
  p.textAlign(p.CENTER, p.CENTER);

  p.drawingContext.shadowBlur = 40;
  p.drawingContext.shadowColor = isWin ? p.color(0, 255, 100) : p.color(255, 50, 50);

  p.fill(isWin ? [200, 255, 220] : [255, 200, 200]);
  p.textSize(48);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 120);

  p.drawingContext.shadowBlur = 0;

  p.fill(COLORS.text);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);

  const pulse = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 255, 100, pulse);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);

  p.pop();
}