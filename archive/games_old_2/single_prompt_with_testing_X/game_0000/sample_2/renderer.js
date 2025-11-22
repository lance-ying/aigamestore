// renderer.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.background(15, 25, 50);
  
  // Title with glow effect
  p.push();
  p.fill(255, 215, 0, 30);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(52);
  p.text("GOLD MINER", CANVAS_WIDTH / 2 + 2, 62);
  p.fill(255, 215, 0);
  p.textSize(50);
  p.text("GOLD MINER", CANVAS_WIDTH / 2, 60);
  p.pop();
  
  // Description
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("Swing your claw and grab treasures!", CANVAS_WIDTH / 2, 120);
  p.text("Meet the money goal before time runs out!", CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.fill(255, 255, 150);
  p.textSize(13);
  p.textAlign(p.LEFT, p.CENTER);
  let instructionY = 180;
  p.text("SPACE: Drop claw to grab items", 100, instructionY);
  p.text("Z: Use dynamite (destroys item)", 100, instructionY + 25);
  p.text("Arrows: Navigate shop", 100, instructionY + 50);
  p.text("ESC: Pause game", 100, instructionY + 75);
  p.text("R: Restart to menu", 100, instructionY + 100);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  let pulse = 0.7 + 0.3 * p.sin(p.frameCount * 0.1);
  p.fill(255, 255, 100, 255 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGameOver(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result message
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Completed Level ${gameState.level}!`, CANVAS_WIDTH / 2, 170);
    p.text(`Total Score: $${gameState.score}`, CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Level ${gameState.level} Failed`, CANVAS_WIDTH / 2, 170);
    p.text(`Final Score: $${gameState.score}`, CANVAS_WIDTH / 2, 200);
  }
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  p.pop();
}

export function renderGameUI(p) {
  p.push();
  
  // Background panel
  p.fill(20, 20, 40, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Level
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Level ${gameState.level}`, 15, 20);
  
  // Goal progress
  let progress = gameState.levelMoney / gameState.goalAmount;
  p.fill(200);
  p.textSize(12);
  p.text(`Goal: $${gameState.levelMoney}/$${gameState.goalAmount}`, 110, 20);
  
  // Progress bar
  let barX = 240;
  let barY = 12;
  let barWidth = 100;
  let barHeight = 16;
  
  p.fill(60, 60, 80);
  p.rect(barX, barY, barWidth, barHeight);
  
  let progressWidth = barWidth * Math.min(progress, 1);
  p.fill(...(progress >= 1 ? [100, 255, 100] : [255, 215, 0]));
  p.rect(barX, barY, progressWidth, barHeight);
  
  // Timer
  let timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [100, 255, 100];
  p.fill(...timeColor);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`Time: ${Math.ceil(gameState.timeRemaining)}s`, 390, 20);
  
  // Inventory
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(12);
  p.text(`💣:${gameState.inventory.dynamite}`, CANVAS_WIDTH - 80, 20);
  p.text(`💪:${gameState.inventory.strength}`, CANVAS_WIDTH - 20, 20);
  
  // Strength active indicator
  if (gameState.strengthActive) {
    p.fill(255, 215, 0, 200);
    p.textSize(10);
    p.text("STRONG!", CANVAS_WIDTH - 50, 35);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text("PAUSED", CANVAS_WIDTH - 10, 45);
  }
  
  p.pop();
}

export function renderBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    let inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    let c = p.lerpColor(p.color(135, 206, 235), p.color(101, 67, 33), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground texture
  p.push();
  p.noStroke();
  for (let i = 0; i < 30; i++) {
    let x = (i * 137) % CANVAS_WIDTH;
    let y = 60 + ((i * 197) % (CANVAS_HEIGHT - 60));
    let size = 2 + (i % 4);
    p.fill(80, 60, 40, 100);
    p.circle(x, y, size);
  }
  p.pop();
}