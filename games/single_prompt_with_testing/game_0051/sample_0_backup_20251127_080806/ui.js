// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  p.background(...COLORS.background);
  
  // Title with glow effect
  p.fill(0, 255, 255, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text('ROBOT ARENA', CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  p.fill(0, 255, 255);
  p.textSize(54);
  p.text('ROBOT ARENA', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255, 100, 100);
  p.textSize(20);
  p.text('Survive the Gladiator Trials', CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(30, 30, 45);
  p.stroke(50, 50, 70);
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 400, 180);
  
  // Instructions
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  
  const instructions = [
    'Arrow Keys: Move your robot',
    'Space: Swing laser sword',
    'Shift: Dash',
    'Z: Block (hold)',
    '',
    'Defeat enemies, collect power-ups, survive!'
  ];
  
  let yPos = CANVAS_HEIGHT / 2 - 70;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2 - 180, yPos);
    yPos += 24;
  });
  
  // Start prompt (pulsing)
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(0, 255, 255, pulse * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  // Controls reminder
  p.fill(150);
  p.textSize(12);
  p.text('ESC: Pause | R: Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

export function renderGame(p) {
  p.background(...COLORS.background);
  
  // Apply camera shake
  if (gameState.cameraShake > 0) {
    p.translate(
      (Math.random() - 0.5) * gameState.cameraShake,
      (Math.random() - 0.5) * gameState.cameraShake
    );
    gameState.cameraShake *= 0.9;
    if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
  }
  
  // Render arena
  renderArena(p);
  
  // Render body parts (detached)
  gameState.bodyParts.forEach(part => {
    if (!part.attached) {
      part.render(p);
    }
  });
  
  // Render power-ups
  gameState.powerUps.forEach(powerUp => powerUp.render(p));
  
  // Render enemies
  gameState.enemies.forEach(enemy => enemy.render(p));
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles
  gameState.particles.forEach(particle => particle.render(p));
  
  // Render HUD
  renderHUD(p);
}

function renderArena(p) {
  // Arena floor
  p.fill(...COLORS.arena);
  p.noStroke();
  p.rect(
    gameState.arenaLeft,
    gameState.arenaTop,
    gameState.arenaRight - gameState.arenaLeft,
    gameState.arenaBottom - gameState.arenaTop
  );
  
  // Arena walls
  p.stroke(...COLORS.arenaWall);
  p.strokeWeight(4);
  p.noFill();
  p.rect(
    gameState.arenaLeft,
    gameState.arenaTop,
    gameState.arenaRight - gameState.arenaLeft,
    gameState.arenaBottom - gameState.arenaTop
  );
  
  // Grid pattern
  p.stroke(40, 40, 60, 100);
  p.strokeWeight(1);
  const gridSize = 50;
  
  for (let x = gameState.arenaLeft; x <= gameState.arenaRight; x += gridSize) {
    p.line(x, gameState.arenaTop, x, gameState.arenaBottom);
  }
  
  for (let y = gameState.arenaTop; y <= gameState.arenaBottom; y += gridSize) {
    p.line(gameState.arenaLeft, y, gameState.arenaRight, y);
  }
}

function renderHUD(p) {
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Wave
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Wave: ${gameState.wave}`, CANVAS_WIDTH - 10, 10);
  
  // Player health bar
  if (gameState.player) {
    const health = gameState.player.getHealth();
    const barWidth = 200;
    const barHeight = 20;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = 10;
    
    // Background
    p.fill(50, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health fill
    const healthRatio = health.current / health.max;
    const healthColor = healthRatio > 0.5 ? COLORS.healthGreen : COLORS.healthRed;
    p.fill(...healthColor);
    p.rect(barX, barY, barWidth * healthRatio, barHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${Math.floor(health.current)}/${health.max}`, CANVAS_WIDTH / 2, barY + barHeight / 2);
  }
  
  // Wave timer
  if (gameState.enemies.length === 0 && gameState.waveTimer > 0) {
    p.fill(0, 255, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    const seconds = Math.ceil(gameState.waveTimer / 60);
    p.text(`Next Wave: ${seconds}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  }
  
  // Ability cooldowns
  if (gameState.player) {
    renderAbilityCooldowns(p);
  }
}

function renderAbilityCooldowns(p) {
  const iconSize = 30;
  const startX = 10;
  const startY = CANVAS_HEIGHT - 50;
  
  // Dash cooldown
  const dashRatio = 1 - (gameState.player.dash.cooldown / 60);
  renderCooldownIcon(p, startX, startY, iconSize, dashRatio, 'D', [100, 100, 255]);
  
  // Sword cooldown
  const swordRatio = 1 - (gameState.player.sword.cooldown / 20);
  renderCooldownIcon(p, startX + iconSize + 10, startY, iconSize, swordRatio, 'S', [0, 255, 255]);
}

function renderCooldownIcon(p, x, y, size, ratio, label, color) {
  // Background
  p.fill(30, 30, 45);
  p.stroke(50, 50, 70);
  p.strokeWeight(2);
  p.rect(x, y, size, size);
  
  // Cooldown fill
  if (ratio < 1) {
    p.fill(...color, 100);
    p.noStroke();
    p.rect(x, y + size * (1 - ratio), size, size * ratio);
  }
  
  // Ready indicator
  if (ratio >= 1) {
    p.fill(...color);
    p.noStroke();
    p.rect(x, y, size, size);
  }
  
  // Label
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(label, x + size / 2, y + size / 2);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(x, y, size, size);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(0, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(64);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(24);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOver(p) {
  // Overlay
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  if (isWin) {
    p.fill(0, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(64);
    p.text('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);
  } else {
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(64);
    p.text('DESTROYED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);
  }
  
  // Stats
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.LEFT, p.CENTER);
  
  const stats = [
    `Final Score: ${gameState.score}`,
    `Wave Reached: ${gameState.wave}`,
    `Enemies Defeated: ${gameState.enemiesDefeated}`,
    `Damage Dealt: ${Math.floor(gameState.totalDamageDealt)}`,
    `Damage Taken: ${Math.floor(gameState.totalDamageTaken)}`,
    `Parts Lost: ${gameState.partsLost}`,
    `Power-ups Collected: ${gameState.powerUpsCollected}`
  ];
  
  let yPos = CANVAS_HEIGHT / 2 - 50;
  stats.forEach(stat => {
    p.text(stat, CANVAS_WIDTH / 2 - 150, yPos);
    yPos += 28;
  });
  
  // Restart prompt
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(0, 255, 255, pulse * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}