// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(10, 10, 30), p.color(30, 10, 50), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Stars in background
  if (gameState.stars && gameState.stars.length > 0) {
    gameState.stars.render(p);
  }
  
  // Title with glow
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title glow
  p.fill(100, 150, 255, 100);
  p.noStroke();
  p.textSize(56);
  p.text('STELLAR ODYSSEY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  
  // Title
  p.fill(150, 200, 255);
  p.textSize(52);
  p.text('STELLAR ODYSSEY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  
  // Subtitle
  p.fill(180, 180, 200);
  p.textSize(16);
  p.text('A love letter to the stars', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  // Instructions box
  p.fill(20, 20, 40, 200);
  p.stroke(100, 150, 255);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 10, 400, 140);
  
  // Instructions
  p.noStroke();
  p.fill(200, 220, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'Arrow Keys: Navigate your starship',
    'Space: Fire energy projectiles',
    'Shift: Activate shield (drains energy)',
    'Z: Boost speed (drains energy)',
    '',
    'Collect all cosmic crystals to win!'
  ];
  
  let yOffset = CANVAS_HEIGHT / 2;
  instructions.forEach((line, index) => {
    p.text(line, CANVAS_WIDTH / 2 - 190, yOffset + index * 20);
  });
  
  // Press ENTER prompt (pulsing)
  const alpha = Math.sin(p.frameCount * 0.1) * 127 + 128;
  p.fill(255, 255, 255, alpha);
  p.textSize(24);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.pop();
}

export function renderHUD(p) {
  if (!gameState.player) return;
  
  p.push();
  
  // HUD background panel
  p.fill(10, 10, 30, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 15, 10);
  
  // Crystals collected
  p.fill(255, 220, 100);
  p.text(`Crystals: ${gameState.crystalsCollected}/${gameState.totalCrystals}`, 15, 35);
  
  // Energy bar
  const energyBarX = 200;
  const energyBarY = 15;
  const energyBarWidth = 180;
  const energyBarHeight = 15;
  const energyRatio = gameState.player.energy / gameState.player.maxEnergy;
  
  // Energy bar background
  p.fill(50, 50, 70);
  p.rect(energyBarX, energyBarY, energyBarWidth, energyBarHeight);
  
  // Energy bar fill (color changes based on level)
  if (energyRatio > 0.5) {
    p.fill(100, 200, 255);
  } else if (energyRatio > 0.25) {
    p.fill(255, 200, 100);
  } else {
    p.fill(255, 100, 100);
  }
  p.rect(energyBarX, energyBarY, energyBarWidth * energyRatio, energyBarHeight);
  
  // Energy bar border
  p.noFill();
  p.stroke(150, 200, 255);
  p.strokeWeight(2);
  p.rect(energyBarX, energyBarY, energyBarWidth, energyBarHeight);
  
  // Energy label
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('ENERGY', energyBarX + energyBarWidth / 2, energyBarY + energyBarHeight / 2);
  
  // Health bar
  const healthBarX = 200;
  const healthBarY = 38;
  const healthBarWidth = 180;
  const healthBarHeight = 15;
  const healthRatio = gameState.player.health / gameState.player.maxHealth;
  
  // Health bar background
  p.fill(50, 50, 70);
  p.noStroke();
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  // Health bar fill
  if (healthRatio > 0.5) {
    p.fill(100, 255, 100);
  } else if (healthRatio > 0.25) {
    p.fill(255, 200, 100);
  } else {
    p.fill(255, 50, 50);
  }
  p.rect(healthBarX, healthBarY, healthBarWidth * healthRatio, healthBarHeight);
  
  // Health bar border
  p.noFill();
  p.stroke(100, 255, 100);
  p.strokeWeight(2);
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  // Health label
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('HULL', healthBarX + healthBarWidth / 2, healthBarY + healthBarHeight / 2);
  
  // Status indicators
  const statusX = 420;
  const statusY = 15;
  
  if (gameState.player.shieldActive) {
    p.fill(100, 200, 255);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text('SHIELD', statusX, statusY);
  }
  
  if (gameState.player.boostActive) {
    p.fill(255, 200, 100);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text('BOOST', statusX, statusY + 20);
  }
  
  p.pop();
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Game over text with glow
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  if (isWin) {
    p.fill(100, 255, 100, 150);
  } else {
    p.fill(255, 100, 100, 150);
  }
  p.textSize(60);
  p.text(isWin ? 'MISSION COMPLETE!' : 'MISSION FAILED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Main text
  if (isWin) {
    p.fill(150, 255, 150);
  } else {
    p.fill(255, 150, 150);
  }
  p.textSize(56);
  p.text(isWin ? 'MISSION COMPLETE!' : 'MISSION FAILED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Message
  p.fill(200, 200, 220);
  p.textSize(18);
  if (isWin) {
    p.text('You collected all cosmic crystals!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text('The universe welcomes you home.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
  } else {
    p.text('Your journey ends among the stars.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  // Stats box
  p.fill(20, 20, 40, 220);
  p.stroke(isWin ? 100 : 255, isWin ? 255 : 100, isWin ? 100 : 100);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 + 30, 300, 80);
  
  // Final stats
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2 - 135, CANVAS_HEIGHT / 2 + 45);
  p.text(`Crystals: ${gameState.crystalsCollected}/${gameState.totalCrystals}`, CANVAS_WIDTH / 2 - 135, CANVAS_HEIGHT / 2 + 68);
  p.text(`Enemies: ${gameState.enemiesDestroyed}`, CANVAS_WIDTH / 2 - 135, CANVAS_HEIGHT / 2 + 91);
  
  // Restart instruction
  const alpha = Math.sin(p.frameCount * 0.1) * 127 + 128;
  p.fill(255, 255, 255, alpha);
  p.textSize(24);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}