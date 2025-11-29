// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(10, 10, 20);
  
  // Render background stars
  renderStars(p);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(255, 50, 50, 30);
  p.textSize(56);
  p.text('STAR FETCHERS', CANVAS_WIDTH / 2, 80);
  
  // Main title
  p.fill(255, 255, 255);
  p.textSize(52);
  p.text('STAR FETCHERS', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 50, 50);
  p.textSize(18);
  p.text('Rise Through The Slums', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  const desc = 'Fight through waves of rival gangsters';
  p.text(desc, CANVAS_WIDTH / 2, 160);
  p.text('in the notorious Gray Zone.', CANVAS_WIDTH / 2, 180);
  p.text('Uncover dark conspiracies as you climb', CANVAS_WIDTH / 2, 200);
  p.text('to the top of the criminal underworld.', CANVAS_WIDTH / 2, 220);
  
  // Controls
  p.fill(150, 150, 255);
  p.textSize(13);
  p.text('ARROW KEYS: Move', CANVAS_WIDTH / 2, 260);
  p.text('SPACE: Dash', CANVAS_WIDTH / 2, 280);
  p.text('Z: Slash Sword', CANVAS_WIDTH / 2, 300);
  p.text('SHIFT: Slow Motion', CANVAS_WIDTH / 2, 320);
  
  // Start prompt with flash
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 230);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Game over text
  p.fill(isWin ? 100 : 255, isWin ? 255 : 50, 50);
  p.textSize(52);
  p.text(isWin ? 'LEGENDARY!' : 'YOU DIED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text(`Survival Time: ${Math.floor(gameState.survivalTime)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Restart prompt
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
}

export function renderGameUI(p) {
  if (!gameState.player) return;
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Survival time
  p.text(`Time: ${Math.floor(gameState.survivalTime)}s`, 10, 35);
  
  // Wave number
  p.text(`Wave: ${gameState.waveNumber}`, 10, 60);
  
  // Health bar
  const barWidth = 200;
  const barHeight = 25;
  const barX = 10;
  const barY = 90;
  const healthRatio = gameState.player.health / gameState.player.maxHealth;
  
  // Background
  p.fill(60, 0, 0);
  p.noStroke();
  p.rect(barX, barY, barWidth, barHeight, 3);
  
  // Health fill
  const healthColor = healthRatio > 0.5 ? [0, 255, 0] : 
                     healthRatio > 0.25 ? [255, 200, 0] : [255, 0, 0];
  p.fill(healthColor[0], healthColor[1], healthColor[2]);
  p.rect(barX, barY, barWidth * healthRatio, barHeight, 3);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(barX, barY, barWidth, barHeight, 3);
  
  // Health text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(
    `HP: ${Math.floor(gameState.player.health)}/${gameState.player.maxHealth}`,
    barX + barWidth / 2,
    barY + barHeight / 2
  );
  
  // Slow-mo bar
  const slowBarWidth = 150;
  const slowBarHeight = 15;
  const slowBarX = 10;
  const slowBarY = 125;
  const slowMoRatio = gameState.slowMoCharge / 180;
  
  p.noStroke();
  p.fill(20, 20, 60);
  p.rect(slowBarX, slowBarY, slowBarWidth, slowBarHeight, 2);
  
  p.fill(100, 150, 255);
  p.rect(slowBarX, slowBarY, slowBarWidth * slowMoRatio, slowBarHeight, 2);
  
  p.stroke(255);
  p.strokeWeight(1);
  p.noFill();
  p.rect(slowBarX, slowBarY, slowBarWidth, slowBarHeight, 2);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text('SLOW-MO', slowBarX, slowBarY - 12);
  
  // Ability cooldowns
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  
  // Dash cooldown
  if (gameState.player.dashCooldown > 0) {
    p.fill(150, 150, 150);
    p.text(`Dash: ${Math.ceil(gameState.player.dashCooldown / 60)}s`, CANVAS_WIDTH - 10, 10);
  } else {
    p.fill(100, 255, 100);
    p.text('Dash: Ready', CANVAS_WIDTH - 10, 10);
  }
  
  // Attack cooldown
  if (gameState.player.swordCooldown > 0) {
    p.fill(150, 150, 150);
    p.text(`Attack: ${Math.ceil(gameState.player.swordCooldown / 60)}s`, CANVAS_WIDTH - 10, 30);
  } else {
    p.fill(255, 100, 100);
    p.text('Attack: Ready', CANVAS_WIDTH - 10, 30);
  }
  
  // Enemy count
  p.fill(255, 200, 200);
  p.text(`Enemies: ${gameState.enemies.length}`, CANVAS_WIDTH - 10, 55);
}

function renderStars(p) {
  for (const star of gameState.stars) {
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(star.x, star.y, star.size);
  }
}

export function renderBackground(p) {
  // Update and render stars
  for (const star of gameState.stars) {
    star.y += star.speed;
    if (star.y > CANVAS_HEIGHT) {
      star.y = 0;
      star.x = Math.random() * CANVAS_WIDTH;
    }
  }
  
  renderStars(p);
  
  // Grid effect
  p.stroke(50, 50, 80, 30);
  p.strokeWeight(1);
  
  const gridSize = 40;
  for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}