// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA } from './globals.js';

export function renderStartScreen(p) {
  p.background(10, 5, 20);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (i * 137.5 + gameState.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (i * 113.2 + gameState.frameCount * 0.3) % CANVAS_HEIGHT;
    const alpha = Math.sin(gameState.frameCount * 0.05 + i) * 50 + 50;
    p.fill(150, 50, 200, alpha);
    p.noStroke();
    p.circle(x, y, 3);
  }
  
  // Title and Subtitle removed as per feedback
  // p.fill(255, 100, 200);
  // p.textAlign(p.CENTER, p.CENTER);
  // p.textSize(48);
  // const titleY = 80 + Math.sin(gameState.frameCount * 0.05) * 5;
  // p.text('LOVE CONQUERS ALL', CANVAS_WIDTH / 2, titleY);
  
  // p.fill(200, 150, 255);
  // p.textSize(18);
  // p.text('A Boss Rush Bullet Hell', CANVAS_WIDTH / 2, titleY + 40);
  
  // Description (Y-coordinates adjusted to shift content up)
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc1 = "An alien girl is trapped in a cave, surrounded by monsters.";
  const desc2 = "She cannot fight, but she can befriend them with love!";
  const desc3 = "Defeat bosses to earn gifts and make your love stronger.";
  p.text(desc1, CANVAS_WIDTH / 2, 120); // Adjusted from 180
  p.text(desc2, CANVAS_WIDTH / 2, 140); // Adjusted from 200
  p.text(desc3, CANVAS_WIDTH / 2, 160); // Adjusted from 220
  
  // Instructions (Y-coordinates adjusted to shift content up)
  p.fill(150, 255, 150);
  p.textSize(16);
  p.text('Arrow Keys: Move | Z: Shoot | Shift: Focus', CANVAS_WIDTH / 2, 200); // Adjusted from 260
  p.text('Space: Special Ability | ESC: Pause', CANVAS_WIDTH / 2, 220); // Adjusted from 280
  
  // Start prompt modified to be the new main title message, moved to title position
  p.fill(255, 255, 100);
  p.textSize(36); // Increased size for new main message
  const alpha = Math.sin(gameState.frameCount * 0.1) * 100 + 155;
  p.fill(255, 255, 100, alpha);
  p.text('press enter to begin', CANVAS_WIDTH / 2, 80); // Adjusted from 340, changed text
}

export function renderBossSelect(p) {
  p.background(20, 10, 30);
  
  // Title
  p.fill(255, 150, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`STAGE ${gameState.currentStage}`, CANVAS_WIDTH / 2, 40);
  
  p.fill(200, 200, 255);
  p.textSize(20);
  p.text('Choose Your Opponent', CANVAS_WIDTH / 2, 80);
  
  // Boss options
  const spacing = 180;
  const startX = (CANVAS_WIDTH - spacing * 2) / 2;
  
  gameState.availableBosses.forEach((boss, index) => {
    const x = startX + spacing * index;
    const y = 200;
    
    // Boss preview
    p.fill(boss.color[0], boss.color[1], boss.color[2]);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(x, y, boss.size * 1.5);
    
    // Boss name
    p.fill(255);
    p.noStroke();
    p.textSize(14);
    p.text(boss.name, x, y + boss.size);
    
    // Difficulty
    p.textSize(12);
    p.fill(200, 200, 100);
    p.text(`Difficulty: ${boss.difficulty}`, x, y + boss.size + 20);
    
    // Key prompt
    p.fill(255, 255, 150);
    p.textSize(16);
    p.text(`Press ${index + 1}`, x, y + boss.size + 45);
  });
}

export function renderPowerUpSelect(p) {
  p.background(15, 25, 35);
  
  // Title
  p.fill(150, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('BOSS DEFEATED!', CANVAS_WIDTH / 2, 40);
  
  p.fill(200, 200, 255);
  p.textSize(20);
  p.text('Choose Your Gift', CANVAS_WIDTH / 2, 80);
  
  // Power-up options
  const spacing = 180;
  const startX = (CANVAS_WIDTH - spacing * 2) / 2;
  
  gameState.availablePowerUps.forEach((powerUp, index) => {
    const x = startX + spacing * index;
    const y = 200;
    
    // Power-up icon
    const pulse = 1 + Math.sin(gameState.frameCount * 0.1 + index) * 0.1;
    p.fill(powerUp.color[0], powerUp.color[1], powerUp.color[2], 150);
    p.noStroke();
    p.circle(x, y, 50 * pulse);
    
    p.fill(powerUp.color[0], powerUp.color[1], powerUp.color[2]);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(x, y, 40 * pulse);
    
    // Power-up name
    p.fill(255);
    p.noStroke();
    p.textSize(14);
    p.text(powerUp.name, x, y + 40);
    
    // Description
    p.textSize(11);
    p.fill(200, 200, 200);
    p.text(powerUp.description, x, y + 60);
    
    // Rarity
    const rarityColor = powerUp.rarity === "common" ? [200, 200, 200] :
                       powerUp.rarity === "uncommon" ? [100, 200, 255] :
                       [255, 200, 100];
    p.fill(rarityColor[0], rarityColor[1], rarityColor[2]);
    p.textSize(10);
    p.text(powerUp.rarity.toUpperCase(), x, y + 75);
    
    // Key prompt
    p.fill(255, 255, 150);
    p.textSize(16);
    p.text(`Press ${index + 1}`, x, y + 95);
  });
}

export function renderGameUI(p) {
  // Draw play area border
  p.stroke(100, 50, 150);
  p.strokeWeight(2);
  p.noFill();
  p.rect(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
  
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Stage
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Stage: ${gameState.currentStage}/${gameState.maxStage}`, CANVAS_WIDTH - 10, 10);
  
  // Health bar
  if (gameState.player) {
    const barWidth = 200;
    const barHeight = 20;
    const barX = 10;
    const barY = 35;
    const healthRatio = gameState.player.stats.health / gameState.player.stats.maxHealth;
    
    // Background
    p.fill(50, 0, 0);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health fill
    const healthColor = healthRatio > 0.5 ? [100, 255, 100] :
                       healthRatio > 0.25 ? [255, 255, 100] :
                       [255, 100, 100];
    p.fill(healthColor[0], healthColor[1], healthColor[2]);
    p.rect(barX, barY, barWidth * healthRatio, barHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${Math.floor(gameState.player.stats.health)}/${gameState.player.stats.maxHealth}`, 
           barX + barWidth / 2, barY + barHeight / 2);
  }
  
  // Special ability cooldown
  if (gameState.player && gameState.player.stats.hasSpecialAbility) {
    const barWidth = 120;
    const barHeight = 15;
    const barX = CANVAS_WIDTH - barWidth - 10;
    const barY = 35;
    const cooldownRatio = 1 - (gameState.player.stats.specialCooldown / gameState.player.stats.maxSpecialCooldown);
    
    p.fill(30, 30, 30);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    p.fill(255, 255, 100);
    p.rect(barX, barY, barWidth * cooldownRatio, barHeight);
    
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('Special [Space]', barX + barWidth / 2, barY + barHeight / 2);
  }
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Game over text
  p.fill(isWin ? 150 : 255, isWin ? 255 : 100, isWin ? 150 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'HEART BROKEN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Message
  p.fill(255);
  p.textSize(20);
  if (isWin) {
    p.text('Your love conquered all!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  } else {
    p.text('Your heart was not strong enough...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  // Stats
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text(`Stage Reached: ${gameState.currentStage}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
  p.text(`Bosses Defeated: ${gameState.bossesDefeated}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  // Restart instruction
  p.fill(255, 255, 100);
  p.textSize(20);
  const alpha = Math.sin(gameState.frameCount * 0.1) * 100 + 155;
  p.fill(255, 255, 100, alpha);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}