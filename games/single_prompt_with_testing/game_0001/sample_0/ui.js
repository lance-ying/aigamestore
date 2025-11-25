// ui.js - UI rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function renderUI(p) {
  // Top bar background
  p.fill(40, 35, 30);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Health
  renderHealth(p);
  
  // Score
  p.fill(255, 220, 150);
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Score: ${gameState.score}`, 10, 18);
  
  // Floor
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Floor ${gameState.currentFloor}`, CANVAS_WIDTH / 2, 18);
  
  // Bombs
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Bombs: ${gameState.playerBombCount}`, CANVAS_WIDTH - 10, 18);
}

function renderHealth(p) {
  const heartSize = 14;
  const heartSpacing = 18;
  const startX = 120;
  const startY = 18;
  
  const maxHearts = Math.ceil(gameState.playerMaxHealth / 2);
  const filledHearts = Math.floor(gameState.playerHealth / 2);
  const hasHalfHeart = gameState.playerHealth % 2 === 1;
  
  for (let i = 0; i < maxHearts; i++) {
    const x = startX + i * heartSpacing;
    
    if (i < filledHearts) {
      // Full heart
      renderFullHeart(p, x, startY, heartSize);
    } else if (i === filledHearts && hasHalfHeart) {
      // Half heart
      renderHalfHeart(p, x, startY, heartSize);
    } else {
      // Empty heart
      renderEmptyHeart(p, x, startY, heartSize);
    }
  }
}

function renderFullHeart(p, x, y, size) {
  p.fill(220, 60, 80);
  p.noStroke();
  const s = size / 2;
  p.ellipse(x - s / 2, y - 1, s, s);
  p.ellipse(x + s / 2, y - 1, s, s);
  p.triangle(x - s, y + 1, x + s, y + 1, x, y + s + 2);
}

function renderHalfHeart(p, x, y, size) {
  p.fill(220, 60, 80);
  p.noStroke();
  const s = size / 2;
  
  // Left half filled
  p.push();
  p.clip(() => {
    p.rect(x - s, y - s, s, size);
  });
  p.ellipse(x - s / 2, y - 1, s, s);
  p.ellipse(x + s / 2, y - 1, s, s);
  p.triangle(x - s, y + 1, x + s, y + 1, x, y + s + 2);
  p.pop();
  
  // Right half outline
  p.noFill();
  p.stroke(220, 60, 80);
  p.strokeWeight(1.5);
  p.arc(x + s / 2, y - 1, s, s, -p.PI / 2, p.PI / 2);
  p.line(x + s, y + 1, x, y + s + 2);
}

function renderEmptyHeart(p, x, y, size) {
  p.noFill();
  p.stroke(220, 60, 80);
  p.strokeWeight(1.5);
  const s = size / 2;
  p.arc(x - s / 2, y - 1, s, s, p.PI, 0);
  p.arc(x + s / 2, y - 1, s, s, p.PI, 0);
  p.line(x - s, y + 1, x, y + s + 2);
  p.line(x + s, y + 1, x, y + s + 2);
}

export function renderPauseIndicator(p) {
  p.fill(255, 220, 150);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text('PAUSED', CANVAS_WIDTH - 10, 45);
}

export function renderStartScreen(p) {
  p.background(30, 25, 20);
  
  // Title
  p.fill(220, 180, 100);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('THE BINDING', CANVAS_WIDTH / 2, 80);
  p.text('OF ISAAC', CANVAS_WIDTH / 2, 120);
  
  // Subtitle
  p.fill(180, 140, 80);
  p.textSize(16);
  p.text('Dungeon Escape', CANVAS_WIDTH / 2, 155);
  
  // Instructions
  p.fill(200, 180, 160);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'Escape the dungeon depths!',
    '',
    'Arrow Keys - Move Isaac',
    'Space - Shoot tears',
    'Z - Drop bomb (damages enemies)',
    'Shift - Special ability (with items)',
    '',
    'Defeat all enemies to open the exit portal.',
    'Collect items to grow stronger.',
    'Survive through multiple floors to win!',
    '',
    'ESC - Pause     R - Restart'
  ];
  
  let yPos = 190;
  instructions.forEach(line => {
    p.text(line, 80, yPos);
    yPos += 18;
  });
  
  // Start prompt
  p.fill(255, 220, 150);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = p.frameCount % 60 < 30;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  }
}

export function renderGameOverScreen(p, won) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(won ? [150, 255, 150] : [255, 150, 150]);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(won ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 140);
  
  p.fill(255, 220, 150);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Floors Cleared: ${gameState.currentFloor - 1}`, CANVAS_WIDTH / 2, 230);
  p.text(`Enemies Defeated: ${gameState.totalEnemiesKilled}`, CANVAS_WIDTH / 2, 260);
  
  p.textSize(18);
  const flash = p.frameCount % 60 < 30;
  if (flash) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  }
}