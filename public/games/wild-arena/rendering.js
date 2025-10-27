// rendering.js - Rendering functions for game screens

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPON_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('WILD ARENA', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text('Survive 5 levels of intense animal combat!', CANVAS_WIDTH / 2, 140);
  p.text('Defeat all enemies to advance. Zone stops when enemies are cleared!', CANVAS_WIDTH / 2, 160);
  
  // Controls
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(180);
  p.text('ARROW KEYS: Move', 130, 200);
  p.text('SPACE: Fire weapon', 130, 220);
  p.text('1/2/3: Switch weapons', 130, 240);
  p.text('SHIFT: Dash ability', 130, 260);
  p.text('ESC: Pause', 130, 280);
  p.text('R: Restart', 130, 300);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
  }
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(255, 200, 50);
    p.textSize(16);
    p.text(`HIGH SCORE: ${Math.floor(gameState.highScore)}`, CANVAS_WIDTH / 2, 380);
  }
  
  p.pop();
}

export function renderPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.fill(200);
  p.textSize(18);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  p.pop();
}

export function renderLevelTransition(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Level complete text
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`LEVEL ${gameState.currentLevel - 1} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Next level text
  p.fill(255, 220, 100);
  p.textSize(32);
  p.text(`LEVEL ${gameState.currentLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Loading text
  p.fill(200);
  p.textSize(18);
  const dots = '.'.repeat((Math.floor(gameState.transitionTimer / 20) % 3) + 1);
  p.text(`Preparing${dots}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  // Health restored notification
  p.fill(100, 255, 150);
  p.textSize(16);
  p.text('HEALTH RESTORED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  
  p.pop();
}

export function renderGameOverScreen(p, isWin) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(20);
    p.text('You survived the Wild Arena!', CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  }
  
  // Score
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`FINAL SCORE: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 200);
  
  // High score
  if (Math.floor(gameState.score) >= gameState.highScore) {
    p.fill(255, 200, 50);
    p.textSize(18);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 230);
  } else if (gameState.highScore > 0) {
    p.fill(200);
    p.textSize(16);
    p.text(`High Score: ${Math.floor(gameState.highScore)}`, CANVAS_WIDTH / 2, 230);
  }
  
  // Instructions
  p.fill(255);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 300);
  
  p.pop();
}

export function renderUI(p) {
  if (!gameState.player) return;
  
  p.push();
  
  // Score (top right)
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`SCORE: ${Math.floor(gameState.score)}`, CANVAS_WIDTH - 10, 10);
  
  // Level (top left)
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Enemies remaining (below level)
  const enemiesRemaining = gameState.enemiesRequired - gameState.enemiesDefeated;
  p.fill(255, 150, 150);
  p.textSize(14);
  p.text(`ENEMIES: ${enemiesRemaining}`, 10, 35);
  
  // Current weapon (top center)
  const weaponName = gameState.player.weapons[gameState.player.currentWeaponIndex];
  const weaponInfo = WEAPON_TYPES[weaponName];
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`WEAPON: ${weaponInfo.name}`, CANVAS_WIDTH / 2, 10);
  
  // Weapon selection indicators
  for (let i = 0; i < gameState.player.weapons.length; i++) {
    const wx = CANVAS_WIDTH / 2 - 40 + i * 40;
    const wy = 35;
    const wSize = 12;
    
    if (i === gameState.player.currentWeaponIndex) {
      p.fill(255, 255, 100);
      p.stroke(255);
      p.strokeWeight(2);
    } else {
      p.fill(100, 100, 100);
      p.stroke(150);
      p.strokeWeight(1);
    }
    p.rect(wx - wSize / 2, wy - wSize / 2, wSize, wSize);
    
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.text(i + 1, wx, wy - 1);
  }
  
  // Player health bar (bottom left)
  const healthBarWidth = 200;
  const healthBarHeight = 20;
  const healthPercent = gameState.player.health / gameState.player.maxHealth;
  
  p.noStroke();
  p.fill(60, 60, 60);
  p.rect(10, CANVAS_HEIGHT - 30, healthBarWidth, healthBarHeight);
  
  p.fill(healthPercent > 0.5 ? 100 : healthPercent > 0.25 ? 200 : 255, healthPercent > 0.5 ? 200 : healthPercent > 0.25 ? 200 : 100, 50);
  p.rect(10, CANVAS_HEIGHT - 30, healthBarWidth * healthPercent, healthBarHeight);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(gameState.player.health)}`, 15, CANVAS_HEIGHT - 28);
  
  // Ability cooldown (bottom center)
  const abilityCooldownPercent = 1 - (gameState.player.ability.cooldown / gameState.player.ability.maxCooldown);
  const abilitySize = 40;
  const abilityX = CANVAS_WIDTH / 2;
  const abilityY = CANVAS_HEIGHT - 50;
  
  p.noStroke();
  p.fill(60, 60, 60);
  p.circle(abilityX, abilityY, abilitySize);
  
  if (abilityCooldownPercent < 1) {
    p.fill(100, 100, 100, 150);
    p.arc(abilityX, abilityY, abilitySize, abilitySize, -p.HALF_PI, -p.HALF_PI + p.TWO_PI * abilityCooldownPercent);
  }
  
  p.fill(abilityCooldownPercent === 1 ? 100 : 50, abilityCooldownPercent === 1 ? 200 : 100, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('DASH', abilityX, abilityY);
  
  p.pop();
}

export function renderZone(p) {
  p.push();
  p.noStroke();
  
  // Draw danger zone overlay using rectangles around the safe circle
  // This creates the darkened area without covering entities
  p.fill(20, 10, 30, 100);
  
  // Calculate bounds
  const zoneLeft = gameState.zoneCenterX - gameState.zoneRadius;
  const zoneRight = gameState.zoneCenterX + gameState.zoneRadius;
  const zoneTop = gameState.zoneCenterY - gameState.zoneRadius;
  const zoneBottom = gameState.zoneCenterY + gameState.zoneRadius;
  
  // Top rectangle
  if (zoneTop > 0) {
    p.rect(0, 0, CANVAS_WIDTH, zoneTop);
  }
  
  // Bottom rectangle
  if (zoneBottom < CANVAS_HEIGHT) {
    p.rect(0, zoneBottom, CANVAS_WIDTH, CANVAS_HEIGHT - zoneBottom);
  }
  
  // Left rectangle (only the middle section)
  if (zoneLeft > 0) {
    const rectTop = Math.max(0, zoneTop);
    const rectBottom = Math.min(CANVAS_HEIGHT, zoneBottom);
    p.rect(0, rectTop, zoneLeft, rectBottom - rectTop);
  }
  
  // Right rectangle (only the middle section)
  if (zoneRight < CANVAS_WIDTH) {
    const rectTop = Math.max(0, zoneTop);
    const rectBottom = Math.min(CANVAS_HEIGHT, zoneBottom);
    p.rect(zoneRight, rectTop, CANVAS_WIDTH - zoneRight, rectBottom - rectTop);
  }
  
  // Draw zone border indicator
  p.noFill();
  p.stroke(180, 140, 255, 200);
  p.strokeWeight(3);
  p.circle(gameState.zoneCenterX, gameState.zoneCenterY, gameState.zoneRadius * 2);
  
  // Add pulsing effect to the border
  const pulse = Math.sin(p.frameCount * 0.05) * 0.3 + 0.7;
  p.stroke(180, 140, 255, 100 * pulse);
  p.strokeWeight(1);
  p.circle(gameState.zoneCenterX, gameState.zoneCenterY, (gameState.zoneRadius + 5) * 2);
  
  p.pop();
}