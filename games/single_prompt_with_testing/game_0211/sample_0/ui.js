// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Render start screen
export function renderStartScreen(p) {
  p.background(10, 15, 30);
  
  // Animated background with moving stars
  renderStarfield(p, true);
  
  // Title with glow effect
  p.push();
  p.fill(255, 150, 0, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text('SKY ACE', CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  p.fill(255, 200, 50);
  p.stroke(255, 100, 0);
  p.strokeWeight(2);
  p.textSize(56);
  p.text('SKY ACE', CANVAS_WIDTH / 2, 80);
  p.pop();
  
  // Subtitle
  p.fill(150, 180, 255);
  p.noStroke();
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('AERIAL COMBAT SIMULATOR', CANVAS_WIDTH / 2, 120);
  
  // Mission briefing box
  p.fill(20, 30, 50, 200);
  p.stroke(100, 150, 255);
  p.strokeWeight(2);
  p.rect(50, 150, CANVAS_WIDTH - 100, 120);
  
  p.fill(255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const briefing = [
    'MISSION: Destroy all enemy aircraft and ground targets',
    'OBJECTIVE: Reach 1000 points to complete mission',
    '',
    'Enemies will spawn from the right. Destroy them before',
    'they overwhelm you. Watch your health and shields!'
  ];
  for (let i = 0; i < briefing.length; i++) {
    p.text(briefing[i], 70, 160 + i * 20);
  }
  
  // Controls
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 300);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    'Arrow Keys: Move aircraft',
    'Space: Fire guns',
    'Z: Launch missile (when locked)',
    'Shift: Afterburner boost'
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 100, 320 + i * 18);
  }
  
  // Start prompt (pulsing)
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(255, 255, 255, pulseAlpha);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

// Render HUD during gameplay
export function renderHUD(p) {
  if (!gameState.player) return;
  
  const player = gameState.player;
  
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 80);
  
  // Health bar
  renderBar(p, 10, 10, 180, 15, player.health, player.maxHealth, 
    [255, 0, 0], [100, 0, 0], 'HEALTH');
  
  // Shield bar
  renderBar(p, 10, 35, 180, 15, player.shield, player.maxShield, 
    [0, 150, 255], [0, 50, 100], 'SHIELD');
  
  // Missile count
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`MISSILES: ${player.missiles}/${player.maxMissiles}`, 10, 58);
  
  // Score
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Mission progress
  p.fill(255);
  p.textSize(14);
  p.text(`PROGRESS: ${Math.floor(gameState.missionProgress)}%`, CANVAS_WIDTH - 10, 40);
  
  // Enemy count
  p.fill(255, 100, 100);
  p.textSize(14);
  p.text(`ENEMIES: ${gameState.enemies.length}`, CANVAS_WIDTH - 10, 60);
  
  // Target lock indicator
  if (gameState.lockedTarget) {
    const target = gameState.lockedTarget;
    const lockSize = 40;
    
    p.push();
    p.translate(target.x, target.y);
    p.noFill();
    p.stroke(255, 0, 0, 200);
    p.strokeWeight(2);
    
    // Rotating lock brackets
    const lockRotation = gameState.frameCount * 0.05;
    p.rotate(lockRotation);
    p.line(-lockSize, -lockSize, -lockSize + 10, -lockSize);
    p.line(-lockSize, -lockSize, -lockSize, -lockSize + 10);
    p.line(lockSize, -lockSize, lockSize - 10, -lockSize);
    p.line(lockSize, -lockSize, lockSize, -lockSize + 10);
    p.line(-lockSize, lockSize, -lockSize + 10, lockSize);
    p.line(-lockSize, lockSize, -lockSize, lockSize - 10);
    p.line(lockSize, lockSize, lockSize - 10, lockSize);
    p.line(lockSize, lockSize, lockSize, lockSize - 10);
    
    // Lock progress circle
    p.noFill();
    p.stroke(255, 0, 0, 150);
    p.arc(0, 0, lockSize * 2, lockSize * 2, 0, p.TWO_PI * gameState.lockProgress);
    
    p.pop();
    
    // "LOCKED" text when fully locked
    if (gameState.lockProgress >= 1) {
      p.fill(255, 0, 0);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('LOCKED', target.x, target.y - lockSize - 10);
    }
  }
  
  // Warning indicators
  if (player.health < player.maxHealth * 0.3) {
    const warningAlpha = (Math.sin(gameState.frameCount * 0.3) + 1) * 127;
    p.fill(255, 0, 0, warningAlpha);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 10);
    p.rect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
    
    p.fill(255, 0, 0, warningAlpha);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('!! LOW HEALTH !!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  }
}

// Render a bar (health, shield, etc.)
function renderBar(p, x, y, width, height, current, max, fillColor, bgColor, label) {
  const ratio = current / max;
  
  // Background
  p.fill(...bgColor);
  p.noStroke();
  p.rect(x, y, width, height);
  
  // Fill
  p.fill(...fillColor);
  p.rect(x, y, width * ratio, height);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(x, y, width, height);
  
  // Label and value
  p.fill(255);
  p.noStroke();
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${label}: ${Math.floor(current)}/${max}`, x + width / 2, y + height / 2);
}

// Render paused overlay
export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.textSize(14);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// Render game over screen
export function renderGameOver(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  if (isWin) {
    p.fill(0, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('MISSION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
    p.text('COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  } else {
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('MISSION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
    p.text('FAILED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.textSize(16);
  p.text(`Enemies Destroyed: ${gameState.enemiesDestroyed}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  p.text(`Ground Targets: ${gameState.groundTargetsDestroyed}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 95);
  
  // Restart prompt
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(255, 255, 255, pulseAlpha);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

// Render background starfield
export function renderStarfield(p, moving = false) {
  // Initialize starfield if needed
  if (gameState.bgLayers.length === 0) {
    for (let layer = 0; layer < 3; layer++) {
      const stars = [];
      for (let i = 0; i < 30; i++) {
        stars.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          size: 1 + Math.random() * 2,
          brightness: 150 + Math.random() * 105
        });
      }
      gameState.bgLayers.push({ stars, speed: (layer + 1) * 0.3 });
    }
  }
  
  // Draw and move stars
  for (const layer of gameState.bgLayers) {
    for (const star of layer.stars) {
      if (moving) {
        star.x -= layer.speed;
        if (star.x < 0) {
          star.x = CANVAS_WIDTH;
          star.y = Math.random() * CANVAS_HEIGHT;
        }
      }
      
      p.fill(star.brightness);
      p.noStroke();
      p.circle(star.x, star.y, star.size);
    }
  }
}