// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  p.background(...COLORS.background);
  
  // Title with glow
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title glow
  p.fill(180, 220, 255, 100);
  p.textSize(52);
  p.text('HOLLOW DEPTHS', CANVAS_WIDTH / 2, 80);
  
  // Title
  p.fill(...COLORS.accent);
  p.textSize(48);
  p.text('HOLLOW DEPTHS', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text('A Knight\'s Journey Through Darkness', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'CONTROLS:',
    'Arrow Keys - Move Left/Right',
    'Up Arrow - Jump (press twice for double jump)',
    'Z - Attack with nail',
    'Down + Z (in air) - Downward slam',
    'Space - Dash',
    '',
    'OBJECTIVE:',
    'Navigate the ancient caverns and find the Ancient Relic!',
    'Defeat enemies to collect Soul essence',
    'Use Soul to heal (33 Soul per heal)',
    '',
    'Press ENTER to begin your journey...'
  ];
  
  let yOffset = 160;
  for (const line of instructions) {
    if (line === '') {
      yOffset += 10;
    } else if (line.includes(':')) {
      p.fill(...COLORS.accent);
      p.textSize(16);
      p.text(line, 80, yOffset);
      yOffset += 22;
    } else {
      p.fill(160, 160, 180);
      p.textSize(13);
      p.text(line, 100, yOffset);
      yOffset += 20;
    }
  }
  
  p.pop();
}

export function renderUI(p) {
  // Health display
  p.push();
  p.fill(40, 40, 50);
  p.rect(10, 10, 150, 30);
  
  p.fill(...COLORS.accent);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('HEALTH', 15, 14);
  
  // Health masks
  for (let i = 0; i < gameState.player.maxHealth; i++) {
    const x = 15 + i * 25;
    const y = 28;
    
    if (i < gameState.player.health) {
      p.fill(...COLORS.health);
    } else {
      p.fill(60, 60, 70);
    }
    
    // Heart shape
    p.noStroke();
    p.beginShape();
    p.vertex(x + 6, y + 3);
    p.bezierVertex(x + 6, y, x, y, x, y + 3);
    p.bezierVertex(x, y + 6, x + 3, y + 9, x + 6, y + 12);
    p.bezierVertex(x + 9, y + 9, x + 12, y + 6, x + 12, y + 3);
    p.bezierVertex(x + 12, y, x + 6, y, x + 6, y + 3);
    p.endShape();
  }
  
  // Soul meter
  p.fill(40, 40, 50);
  p.rect(10, 50, 150, 30);
  
  p.fill(...COLORS.accent);
  p.textSize(14);
  p.text('SOUL', 15, 54);
  
  const soulRatio = gameState.soul / gameState.maxSoul;
  p.fill(30, 30, 40);
  p.rect(15, 68, 140, 8);
  
  p.fill(...COLORS.soul);
  p.rect(15, 68, 140 * soulRatio, 8);
  
  // Soul text
  p.fill(200, 200, 220);
  p.textSize(11);
  p.text(`${gameState.soul}/${gameState.maxSoul}`, 20, 68);
  
  // Score
  p.fill(40, 40, 50);
  p.rect(CANVAS_WIDTH - 160, 10, 150, 30);
  
  p.fill(...COLORS.accent);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 15, 14);
  
  // Enemies defeated
  p.fill(180, 180, 200);
  p.textSize(12);
  p.text(`Enemies: ${gameState.enemiesDefeated}`, CANVAS_WIDTH - 15, 28);
  
  p.pop();
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.push();
  p.fill(...COLORS.accent);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.fill(200, 200, 220);
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.textSize(16);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.pop();
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  if (isWin) {
    p.fill(255, 220, 100);
    p.textSize(52);
    p.text('RELIC FOUND!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 200, 220);
    p.textSize(18);
    p.text('The ancient power is yours!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  } else {
    p.fill(...COLORS.health);
    p.textSize(52);
    p.text('DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 200, 220);
    p.textSize(18);
    p.text('The darkness claims another soul...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  }
  
  // Stats
  p.fill(...COLORS.accent);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  p.fill(180, 180, 200);
  p.textSize(18);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text(`Soul Collected: ${gameState.soul}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  
  // Restart instruction
  p.fill(200, 200, 220);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
  
  p.pop();
}

export function renderBackground(p) {
  // Parallax background layers
  const layers = [
    { depth: 0.1, color: [15, 15, 20], y: 0 },
    { depth: 0.3, color: [20, 20, 28], y: 50 },
    { depth: 0.5, color: [25, 25, 32], y: 100 }
  ];
  
  for (const layer of layers) {
    const offsetX = gameState.cameraX * layer.depth;
    
    p.fill(...layer.color);
    p.noStroke();
    
    // Draw repeating pattern
    for (let x = -CANVAS_WIDTH; x < CANVAS_WIDTH * 2; x += 100) {
      const screenX = x - (offsetX % 100);
      p.rect(screenX, layer.y, 100, CANVAS_HEIGHT);
    }
  }
  
  // Draw cave features
  p.push();
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (i * 150 - gameState.cameraX * 0.4) % CANVAS_WIDTH;
    const y = 50 + (i % 3) * 80;
    const size = 30 + (i % 4) * 10;
    
    p.fill(15, 15, 20, 100);
    p.circle(x, y, size);
  }
  p.pop();
}