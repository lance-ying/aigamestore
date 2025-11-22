// rendering.js - Rendering logic for different game phases
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE } from './globals.js';
import { drawSnake } from './player.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Animated background
  drawAnimatedBackground(p);
  
  // Title
  p.push();
  p.fill(100, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SNAKE VS BLOCK", CANVAS_WIDTH / 2, 80);
  
  // Subtitle effect
  p.fill(255, 255, 255, 150);
  p.textSize(16);
  p.text("Endless Survival Challenge", CANVAS_WIDTH / 2, 120);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(200, 220, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  const instructions = [
    "OBJECTIVE:",
    "  • Survive as long as possible",
    "  • Hit blocks to destroy them (lose balls equal to block number)",
    "  • Collect orbs to grow your snake",
    "  • Game ends when snake reaches 0 balls",
    "",
    "CONTROLS:",
    "  • LEFT/RIGHT ARROW - Steer snake",
    "  • ESC - Pause game",
    "  • R - Restart from game over"
  ];
  
  let y = 160;
  for (let line of instructions) {
    p.text(line, 80, y);
    y += 20;
  }
  p.pop();
  
  // Start prompt
  p.push();
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
  p.pop();
}

export function drawPlayingScreen(p) {
  p.background(15, 15, 30);
  
  // Draw scrolling grid
  drawScrollingGrid(p);
  
  // Draw all entities
  for (let entity of gameState.entities) {
    if (entity.active !== false) {
      entity.draw(p);
    }
  }
  
  // Draw snake
  drawSnake(p);
  
  // Draw UI
  drawGameUI(p);
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.push();
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 40);
  
  // Dim overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Game Over title
  p.push();
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  p.pop();
  
  // Stats
  p.push();
  p.fill(200, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 180);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 210);
  p.text(`Orbs Collected: ${gameState.orbsCollected}`, CANVAS_WIDTH / 2, 240);
  p.text(`Blocks Hit: ${gameState.blocksHit}`, CANVAS_WIDTH / 2, 270);
  p.pop();
  
  // Restart prompt
  p.push();
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
  p.pop();
}

function drawAnimatedBackground(p) {
  p.push();
  p.stroke(40, 40, 80, 100);
  p.strokeWeight(1);
  
  for (let i = 0; i < 10; i++) {
    const offset = (p.frameCount * 0.5 + i * 40) % CANVAS_HEIGHT;
    p.line(0, offset, CANVAS_WIDTH, offset);
  }
  p.pop();
}

function drawScrollingGrid(p) {
  p.push();
  p.stroke(30, 30, 60, 100);
  p.strokeWeight(1);
  
  // Vertical lines
  for (let x = 0; x < CANVAS_WIDTH; x += 50) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  
  // Horizontal lines with scroll
  const offset = gameState.scrollOffset % 50;
  for (let y = -50; y < CANVAS_HEIGHT + 50; y += 50) {
    p.line(0, y + offset, CANVAS_WIDTH, y + offset);
  }
  p.pop();
}

function drawGameUI(p) {
  p.push();
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${Math.floor(gameState.score)}`, 10, 10);
  
  // Distance
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, 10, 30);
  
  // Snake length with color coding
  const lengthColor = gameState.snakeLength < 10 ? [255, 100, 100] : 
                      gameState.snakeLength < 20 ? [255, 255, 100] : 
                      [100, 255, 100];
  p.fill(...lengthColor);
  p.textSize(20);
  p.text(`Length: ${gameState.snakeLength}`, 10, 55);
  
  p.pop();
}