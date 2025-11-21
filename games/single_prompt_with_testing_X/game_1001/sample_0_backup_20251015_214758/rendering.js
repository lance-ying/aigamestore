// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONTAINER_X, CONTAINER_Y, 
         CONTAINER_WIDTH, CONTAINER_HEIGHT, DANGER_LINE_Y, FRUIT_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(240, 248, 255);
  
  // Title
  p.fill(255, 100, 100);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text("FRUIT MATCH", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(100, 150, 250);
  p.textSize(20);
  p.text("Drop & Merge Puzzle", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(255, 255, 255, 200);
  p.stroke(100, 150, 250);
  p.strokeWeight(3);
  p.rect(CANVAS_WIDTH / 2 - 250, 150, 500, 160, 10);
  
  // Instructions
  p.fill(50);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.NORMAL);
  
  const instructions = [
    "🎯 Drop fruits to match and merge identical ones",
    "🍒 Start with cherries, work up to watermelon!",
    "⬅️ ➡️  Move preview fruit left/right",
    "SPACE  Drop the fruit",
    "⚠️  Don't let fruits cross the red danger line!"
  ];
  
  let yPos = 165;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2 - 230, yPos);
    yPos += 28;
  });
  
  // Start prompt
  p.fill(255, 100, 100);
  p.textSize(24);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 100, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  // Background
  p.background(240, 248, 255);
  
  // Draw container
  drawContainer(p);
  
  // Draw danger line
  p.stroke(255, 50, 50);
  p.strokeWeight(3);
  p.line(CONTAINER_X - 190, DANGER_LINE_Y, CONTAINER_X + 190, DANGER_LINE_Y);
  p.fill(255, 50, 50);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("DANGER", CONTAINER_X - 185, DANGER_LINE_Y - 12);
  
  // Draw all fruits
  gameState.fruits.forEach(fruit => {
    fruit.render();
  });
  
  // Draw preview fruit if available
  if (gameState.currentFruit && gameState.canDrop) {
    gameState.currentFruit.render();
  }
  
  // Draw UI
  drawUI(p);
}

function drawContainer(p) {
  // Container background
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.rect(CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT);
  
  // Container walls
  p.fill(139, 90, 60);
  p.noStroke();
  
  // Bottom
  p.rect(CONTAINER_X, CONTAINER_Y + CONTAINER_HEIGHT / 2 + 5, CONTAINER_WIDTH + 20, 10);
  
  // Left wall
  p.rect(CONTAINER_X - CONTAINER_WIDTH / 2 - 5, CONTAINER_Y, 10, CONTAINER_HEIGHT + 10);
  
  // Right wall
  p.rect(CONTAINER_X + CONTAINER_WIDTH / 2 + 5, CONTAINER_Y, 10, CONTAINER_HEIGHT + 10);
}

function drawUI(p) {
  // Score
  p.fill(50);
  p.noStroke();
  p.textSize(24);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.BOLD);
  p.text(`Score: ${gameState.score}`, 20, 20);
  
  // Next fruit indicator (top right)
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("Next:", CANVAS_WIDTH - 70, 25);
  
  const nextType = FRUIT_TYPES[gameState.nextFruitType];
  p.fill(...nextType.color);
  p.circle(CANVAS_WIDTH - 35, 35, nextType.size * 1.5);
  
  // Fruit legend (left side)
  p.textSize(10);
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(50);
  let legendY = 60;
  
  FRUIT_TYPES.slice(0, 5).forEach((type, i) => {
    p.fill(...type.color);
    p.circle(30, legendY, type.size * 0.8);
    p.fill(50);
    p.text(type.name, 50, legendY);
    legendY += 25;
  });
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(240, 248, 255);
  
  // Draw final state
  drawContainer(p);
  gameState.fruits.forEach(fruit => {
    fruit.render();
  });
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Win or lose message
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.textSize(56);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text("🍉 YOU WIN! 🍉", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(24);
    p.text("Watermelon Created!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  } else {
    p.fill(255, 100, 100);
    p.textSize(56);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text("Fruits spilled over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  }
  
  // Final score
  p.fill(255, 215, 0);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Restart prompt
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 255, alpha);
  p.textSize(24);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
}