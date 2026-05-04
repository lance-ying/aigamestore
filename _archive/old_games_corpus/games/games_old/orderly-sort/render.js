// render.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_COLS, GRID_ROWS, CELL_WIDTH, CELL_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 30, 40);
  
  // Decorative background pattern
  p.push();
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    const x = (p.noise(i * 0.1) * CANVAS_WIDTH);
    const y = (p.noise(i * 0.1 + 100) * CANVAS_HEIGHT);
    const size = p.noise(i * 0.1 + 200) * 30 + 10;
    p.fill(50, 50, 60, 50);
    p.circle(x, y, size);
  }
  p.pop();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("ORDERLY SORT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(18);
  p.text("Organize the Chaos", CANVAS_WIDTH / 2, 125);
  
  // Instructions
  p.fill(220, 220, 230);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "HOW TO PLAY:",
    "• Use ARROW KEYS to move the selector",
    "• Press SPACE to pick up items",
    "• Move to matching containers and press SPACE to drop",
    "• Match colors and shapes to score points",
    "• Sort all items before time runs out!",
    "",
    "SCORING:",
    "• Correct placement: +100 points",
    "• Wrong placement: -25 points",
    "• Time remaining bonus at level end"
  ];
  
  let y = 165;
  instructions.forEach(line => {
    if (line.startsWith("•")) {
      p.fill(180, 180, 200);
      p.text(line, 100, y);
    } else {
      p.fill(255, 220, 100);
      p.text(line, 80, y);
    }
    y += 22;
  });
  
  // Start prompt
  const alpha = (p.sin(p.frameCount * 0.1) * 0.5 + 0.5) * 255;
  p.fill(100, 255, 100, alpha);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawGame(p) {
  p.background(35, 35, 45);
  
  // Grid background
  drawGrid(p);
  
  // Draw containers first
  const selector = gameState.player;
  gameState.containers.forEach(container => {
    const isHovered = selector && 
      selector.gridX === container.gridX && 
      selector.gridY === container.gridY;
    container.draw(isHovered);
  });
  
  // Draw items
  gameState.items.forEach(item => {
    // Items being held follow selector
    if (item.isBeingHeld && selector) {
      item.setTarget(selector.x, selector.y - 40);
    }
    item.update(1 / 60);
    item.draw();
  });
  
  // Draw selector
  if (selector) {
    selector.update();
    selector.draw();
  }
  
  // Draw UI
  drawUI(p);
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255, 255, 255, 255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }
}

function drawGrid(p) {
  p.stroke(50, 50, 60);
  p.strokeWeight(1);
  
  for (let i = 0; i <= GRID_COLS; i++) {
    p.line(i * CELL_WIDTH, 0, i * CELL_WIDTH, CANVAS_HEIGHT);
  }
  for (let i = 0; i <= GRID_ROWS; i++) {
    p.line(0, i * CELL_HEIGHT, CANVAS_WIDTH, i * CELL_HEIGHT);
  }
}

function drawUI(p) {
  // Score panel
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(10, 10, 180, 70, 5);
  
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level: ${gameState.currentLevel}`, 20, 20);
  p.text(`Score: ${gameState.score}`, 20, 40);
  p.text(`High: ${gameState.highScore}`, 20, 60);
  
  // Time panel
  p.fill(20, 20, 30, 200);
  p.rect(CANVAS_WIDTH - 190, 10, 180, 50, 5);
  
  const timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [100, 255, 100];
  p.fill(...timeColor);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Time: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH - 20, 20);
  
  // Time bar
  const timePercent = gameState.timeRemaining / gameState.timeLimit;
  p.fill(50, 50, 60);
  p.rect(CANVAS_WIDTH - 180, 45, 160, 10, 2);
  p.fill(...timeColor);
  p.rect(CANVAS_WIDTH - 180, 45, 160 * timePercent, 10, 2);
  
  // Progress indicator
  const totalItems = gameState.items.length;
  const sortedItems = gameState.items.filter(i => i.isSorted).length;
  
  p.fill(20, 20, 30, 200);
  p.rect(CANVAS_WIDTH / 2 - 80, 10, 160, 30, 5);
  
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`Sorted: ${sortedItems}/${totalItems}`, CANVAS_WIDTH / 2, 18);
}

export function drawGameOver(p) {
  p.background(30, 30, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Result text
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "COMPLETE!" : "TIME'S UP!", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(255, 220, 100);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 170);
  
  // High score
  if (gameState.score >= gameState.highScore) {
    p.fill(255, 200, 50);
    p.textSize(24);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 220);
  } else {
    p.fill(200, 200, 220);
    p.textSize(20);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 220);
  }
  
  // Message
  p.fill(200, 200, 220);
  p.textSize(16);
  if (isWin) {
    p.text("You've mastered the art of organization!", CANVAS_WIDTH / 2, 270);
  } else {
    p.text(`Completed ${gameState.currentLevel - 1} level(s)`, CANVAS_WIDTH / 2, 270);
  }
  
  // Restart prompt
  const alpha = (p.sin(p.frameCount * 0.1) * 0.5 + 0.5) * 255;
  p.fill(100, 200, 255, alpha);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}