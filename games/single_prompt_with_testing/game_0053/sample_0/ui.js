// UI rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderStartScreen(p) {
  // Animated background
  renderBackground(p);
  
  // Title
  p.push();
  p.fill(255, 100, 200);
  p.stroke(255);
  p.strokeWeight(3);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('MAIDEN SPELL', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255);
  p.strokeWeight(2);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text('✧ Magical Battle Arena ✧', CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rectMode(p.CENTER);
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20, 450, 180, 10);
  
  // Instructions
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  
  const instructions = [
    'Dodge enemy projectiles and defeat the boss!',
    '',
    'Arrow Keys: Move your magical girl',
    'Space: Fire magical projectiles',
    'Shift: Activate shield (limited duration)',
    'Z: Unleash charged spell (when full)'
  ];
  
  let yPos = CANVAS_HEIGHT / 2 - 30;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 24;
  });
  
  // Start prompt (pulsing)
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, pulseAlpha);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.pop();
}

export function renderUI(p) {
  if (!gameState.player) return;
  
  p.push();
  
  // Score
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Wave indicator
  if (!gameState.bossActive) {
    p.text(`Wave: ${gameState.wave}/${gameState.maxWaves - 1}`, 10, 35);
  } else {
    p.fill(255, 0, 0);
    p.text('BOSS BATTLE!', 10, 35);
  }
  
  // Health bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = 10;
  const barY = 65;
  const healthRatio = gameState.player.health / gameState.player.maxHealth;
  
  p.noStroke();
  p.fill(50, 0, 0);
  p.rect(barX, barY, barWidth, barHeight);
  
  // Health gradient
  const healthColor = healthRatio > 0.5 ? [0, 255, 100] : healthRatio > 0.25 ? [255, 200, 0] : [255, 50, 50];
  p.fill(...healthColor);
  p.rect(barX, barY, barWidth * healthRatio, barHeight);
  
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(barX, barY, barWidth, barHeight);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, barX + barWidth / 2, barY + barHeight / 2);
  
  // Charge meter
  const chargeBarWidth = 150;
  const chargeBarHeight = 15;
  const chargeBarX = 10;
  const chargeBarY = 95;
  const chargeRatio = gameState.player.chargeLevel / gameState.player.maxCharge;
  
  p.noStroke();
  p.fill(30, 30, 60);
  p.rect(chargeBarX, chargeBarY, chargeBarWidth, chargeBarHeight);
  
  if (chargeRatio >= 1) {
    // Full - pulsing gold
    const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.3) * 100;
    p.fill(255, 255, 100, pulseAlpha);
  } else {
    p.fill(100, 100, 255);
  }
  p.rect(chargeBarX, chargeBarY, chargeBarWidth * chargeRatio, chargeBarHeight);
  
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(chargeBarX, chargeBarY, chargeBarWidth, chargeBarHeight);
  
  p.fill(255);
  p.noStroke();
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(chargeRatio >= 1 ? 'READY! Press Z' : 'Charge Spell', chargeBarX + chargeBarWidth / 2, chargeBarY + chargeBarHeight / 2);
  
  // Shield indicator
  if (gameState.player.shieldActive) {
    p.fill(150, 200, 255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    const shieldRatio = gameState.player.shieldDuration / gameState.player.maxShieldDuration;
    p.text(`Shield: ${Math.ceil(shieldRatio * 100)}%`, 10, 115);
  } else if (gameState.player.shieldCooldown > 0) {
    p.fill(150, 150, 150);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`Shield: ${Math.ceil(gameState.player.shieldCooldown / 60)}s`, 10, 115);
  }
  
  p.pop();
}

export function renderPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

export function renderGameOver(p) {
  p.push();
  
  // Dark overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Result text
  if (isWin) {
    p.fill(255, 215, 0);
    p.stroke(255, 100, 200);
  } else {
    p.fill(255, 50, 50);
    p.stroke(150, 0, 0);
  }
  
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text(isWin ? 'VICTORY!' : 'DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Final score
  p.fill(255);
  p.noStroke();
  p.textSize(28);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  // Stats
  p.textSize(18);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Waves Completed: ${gameState.wave - 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  // Restart prompt
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, pulseAlpha);
  p.textSize(24);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  p.pop();
}

export function renderBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(20, 10, 40), p.color(80, 40, 100), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Stars
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    const x = (i * 123 + gameState.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (i * 456) % CANVAS_HEIGHT;
    const size = (i % 3) + 1;
    const twinkle = Math.sin(gameState.frameCount * 0.05 + i) * 0.5 + 0.5;
    p.fill(255, 255, 200, twinkle * 200);
    p.circle(x, y, size);
  }
}

export function renderGame(p) {
  // Background
  renderBackground(p);
  
  // Apply screen shake
  if (gameState.screenShake > 0) {
    p.translate(
      (Math.random() - 0.5) * gameState.screenShake,
      (Math.random() - 0.5) * gameState.screenShake
    );
  }
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity && entity.render) {
      entity.render(p);
    }
  });
  
  // Render particles
  gameState.particles.forEach(particle => {
    particle.render(p);
  });
  
  // Flash effect
  if (gameState.flashAlpha > 0) {
    p.fill(255, 255, 255, gameState.flashAlpha);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  
  // Reset translation
  if (gameState.screenShake > 0) {
    p.translate(0, 0);
  }
}