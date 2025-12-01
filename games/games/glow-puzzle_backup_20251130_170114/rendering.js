// Rendering functions
import { gameState } from './globals.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_PADDING, DOT_RADIUS, LINE_WIDTH, GLOW_INTENSITY } from './globals.js';
import { getDotPosition } from './puzzles.js';

export function renderStartScreen(p) {
  p.background(15, 15, 25);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 3; i > 0; i--) {
    p.fill(100, 200, 255, 30 * i);
    p.textSize(48 + i * 2);
    p.text("GLOW PUZZLE", CANVAS_WIDTH / 2, 80);
  }
  
  // Main title
  p.fill(150, 220, 255);
  p.textSize(48);
  p.text("GLOW PUZZLE", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Connect all dots with a continuous path", CANVAS_WIDTH / 2, 150);
  p.text("Never retrace a line segment", CANVAS_WIDTH / 2, 170);
  p.text("Find the single valid Eulerian path!", CANVAS_WIDTH / 2, 190);
  
  p.fill(180, 180, 200);
  p.textSize(13);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 230);
  p.textSize(12);
  p.text("Arrow Keys: Navigate grid", CANVAS_WIDTH / 2, 250);
  p.text("Space: Select dot & draw connection", CANVAS_WIDTH / 2, 270);
  p.text("Shift: Undo last connection", CANVAS_WIDTH / 2, 290);
  p.text("Z: Reset puzzle", CANVAS_WIDTH / 2, 310);
  
  // Start prompt with pulse
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, pulseAlpha);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function renderPlaying(p) {
  p.background(15, 15, 25);
  
  if (!gameState.puzzleData) return;
  
  const { rows, cols } = gameState.puzzleData;
  const gridWidth = CANVAS_WIDTH - GRID_PADDING * 2;
  const gridHeight = CANVAS_HEIGHT - GRID_PADDING * 2 - 40;
  const offsetX = GRID_PADDING;
  const offsetY = GRID_PADDING + 20;
  
  // Draw connections from puzzle
  drawConnections(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
  
  // Draw completed path
  drawPath(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
  
  // Draw dots
  drawDots(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
  
  // Draw UI
  drawUI(p);
  
  // Draw puzzle complete overlay
  if (gameState.puzzleComplete) {
    drawPuzzleCompleteOverlay(p);
  }
}

function drawConnections(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY) {
  const connections = gameState.puzzleData.connections;
  
  p.strokeWeight(LINE_WIDTH);
  
  for (const [dot1, dot2] of connections) {
    const pos1 = getDotPosition(dot1, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
    const pos2 = getDotPosition(dot2, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
    
    const connKey = `${Math.min(dot1, dot2)}-${Math.max(dot1, dot2)}`;
    const isCompleted = gameState.completedConnections.has(connKey);
    
    if (isCompleted) {
      // Completed connection - bright glow
      for (let i = 3; i > 0; i--) {
        p.stroke(100, 255, 200, 50 * i);
        p.strokeWeight(LINE_WIDTH + i * 2);
        p.line(pos1.x, pos1.y, pos2.x, pos2.y);
      }
      p.stroke(150, 255, 220);
      p.strokeWeight(LINE_WIDTH);
      p.line(pos1.x, pos1.y, pos2.x, pos2.y);
    } else {
      // Uncompleted connection - dim
      p.stroke(50, 50, 70, 100);
      p.strokeWeight(LINE_WIDTH - 1);
      p.line(pos1.x, pos1.y, pos2.x, pos2.y);
    }
  }
}

function drawPath(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY) {
  if (gameState.currentPath.length < 2) return;
  
  p.strokeWeight(LINE_WIDTH + 2);
  
  for (let i = 0; i < gameState.currentPath.length - 1; i++) {
    const dot1 = gameState.currentPath[i];
    const dot2 = gameState.currentPath[i + 1];
    
    const pos1 = getDotPosition(dot1, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
    const pos2 = getDotPosition(dot2, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
    
    // Animated glow
    const glowPhase = (p.frameCount * 0.1 + i * 0.5) % (Math.PI * 2);
    const glowAlpha = 100 + Math.sin(glowPhase) * 50;
    
    for (let j = 2; j > 0; j--) {
      p.stroke(255, 200, 100, glowAlpha * j / 2);
      p.strokeWeight(LINE_WIDTH + 2 + j * 2);
      p.line(pos1.x, pos1.y, pos2.x, pos2.y);
    }
  }
}

function drawDots(p, rows, cols, gridWidth, gridHeight, offsetX, offsetY) {
  const totalDots = rows * cols;
  
  for (let i = 0; i < totalDots; i++) {
    const pos = getDotPosition(i, rows, cols, gridWidth, gridHeight, offsetX, offsetY);
    
    const isInPath = gameState.currentPath.includes(i);
    const isStart = gameState.currentPath.length > 0 && gameState.currentPath[0] === i;
    const isEnd = gameState.currentPath.length > 0 && gameState.currentPath[gameState.currentPath.length - 1] === i;
    const isCursor = gameState.cursorPosition.row === pos.row && gameState.cursorPosition.col === pos.col;
    
    // Enhanced glow when puzzle complete
    if (gameState.puzzleComplete && isInPath) {
      const celebrationGlow = 30 + Math.sin(p.frameCount * 0.2) * 10;
      for (let j = 4; j > 0; j--) {
        p.fill(100, 255, 200, 50 * j);
        p.noStroke();
        p.circle(pos.x, pos.y, (DOT_RADIUS + celebrationGlow) * (1 + j * 0.4));
      }
    } else if (isInPath || isCursor) {
      const glowSize = isCursor ? GLOW_INTENSITY + Math.sin(p.frameCount * 0.15) * 5 : GLOW_INTENSITY;
      for (let j = 3; j > 0; j--) {
        p.fill(...(isInPath ? [255, 200, 100, 40 * j] : [100, 150, 255, 40 * j]));
        p.noStroke();
        p.circle(pos.x, pos.y, (DOT_RADIUS + glowSize) * (1 + j * 0.3));
      }
    }
    
    // Dot
    if (isStart) {
      p.fill(100, 255, 100);
      p.stroke(50, 200, 50);
    } else if (isEnd) {
      p.fill(255, 200, 100);
      p.stroke(200, 150, 50);
    } else if (isInPath) {
      if (gameState.puzzleComplete) {
        p.fill(150, 255, 220);
        p.stroke(100, 200, 170);
      } else {
        p.fill(255, 220, 150);
        p.stroke(200, 170, 100);
      }
    } else if (isCursor) {
      p.fill(150, 180, 255);
      p.stroke(100, 130, 200);
    } else {
      p.fill(80, 80, 100);
      p.stroke(60, 60, 80);
    }
    
    p.strokeWeight(2);
    p.circle(pos.x, pos.y, DOT_RADIUS * 2);
  }
}

function drawPuzzleCompleteOverlay(p) {
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Success message with animated glow
  p.textAlign(p.CENTER, p.CENTER);
  
  const pulseScale = 1 + Math.sin(p.frameCount * 0.15) * 0.1;
  const glowIntensity = 150 + Math.sin(p.frameCount * 0.2) * 100;
  
  // Glow effect
  for (let i = 5; i > 0; i--) {
    p.fill(100, 255, 200, 40 * i);
    p.textSize((36 + i * 3) * pulseScale);
    p.text("PUZZLE COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  // Main text
  p.fill(150, 255, 220, glowIntensity);
  p.textSize(36 * pulseScale);
  p.text("PUZZLE COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  // Bonus points
  const points = 100 * (gameState.currentPuzzle + 1);
  p.fill(255, 255, 150);
  p.textSize(20);
  p.text(`+${points} points!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Next puzzle or win message
  if (gameState.currentPuzzle < gameState.totalPuzzles - 1) {
    p.fill(200, 200, 220, 200);
    p.textSize(16);
    p.text("Loading next puzzle...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  } else {
    p.fill(255, 255, 100, 200);
    p.textSize(18);
    p.text("All puzzles complete!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }
  
  p.pop();
}

function drawUI(p) {
  // Top UI
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text(`Puzzle: ${gameState.currentPuzzle + 1}/${gameState.totalPuzzles}`, 20, 15);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 15);
  
  // Progress indicator
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  const progress = `${gameState.completedConnections.size}/${gameState.requiredConnections.size}`;
  p.text(`Connections: ${progress}`, 20, 35);
  
  p.pop();
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 100);
    p.textSize(12);
    p.text("PAUSED", CANVAS_WIDTH - 20, 35);
    p.pop();
  }
}

export function renderGameOver(p) {
  p.background(15, 15, 25);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title with glow
  const titleColor = isWin ? [100, 255, 150] : [255, 100, 100];
  for (let i = 3; i > 0; i--) {
    p.fill(...titleColor, 30 * i);
    p.textSize(42 + i * 2);
    p.text(isWin ? "ALL PUZZLES COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(...titleColor);
  p.textSize(42);
  p.text(isWin ? "ALL PUZZLES COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(200, 200, 220);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Puzzles Completed: ${gameState.currentPuzzle}/${gameState.totalPuzzles}`, CANVAS_WIDTH / 2, 210);
  
  if (isWin) {
    p.fill(150, 220, 255);
    p.textSize(16);
    p.text("Congratulations!", CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, pulseAlpha);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  
  p.pop();
}