// rendering.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_WAVE_COMPLETE } from './globals.js';
import { drawParticles } from './particles.js';
import { drawUpgradeScreen } from './upgrades.js';

export function drawStartScreen(p) {
  p.background(20, 10, 30);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 50, 50, 100);
  p.textSize(48);
  p.text("SHOOT THE ZOMBIRDS", 300, 80);
  p.fill(255, 200, 50);
  p.textSize(44);
  p.text("SHOOT THE ZOMBIRDS", 300, 78);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Defend your pumpkin patch from waves of mutant Zombirds!", 300, 130);
  p.text("Each Zombird that lands will damage a pumpkin.", 300, 150);
  p.text("Survive as long as you can and earn coins to upgrade!", 300, 170);
  
  // Instructions
  p.fill(150, 255, 150);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("ARROW KEYS - Aim crossbow", 150, 210);
  p.text("SPACE - Fire bolt", 150, 230);
  p.text("SHIFT - Multi-shot (unlock with coins)", 150, 250);
  p.text("Z - Shield (unlock with coins)", 150, 270);
  p.text("ESC - Pause game", 150, 290);
  
  // Start prompt with pulse
  const pulse = Math.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(pulse, pulse, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", 300, 350);
}

export function drawGame(p) {
  p.background(30, 20, 50);
  
  // Draw ground
  p.fill(60, 40, 20);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  
  // Draw grass
  p.fill(40, 80, 40);
  for (let i = 0; i < 20; i++) {
    const x = i * 30 + (p.sin(p.frameCount * 0.02 + i) * 5);
    p.triangle(x, CANVAS_HEIGHT - 80, x + 10, CANVAS_HEIGHT - 90, x + 20, CANVAS_HEIGHT - 80);
  }
  
  // Draw pumpkins
  for (const pumpkin of gameState.pumpkins) {
    pumpkin.draw(p);
  }
  
  // Draw shield effect
  if (gameState.shieldDuration > 0) {
    p.push();
    p.noFill();
    p.stroke(100, 200, 255, 150);
    p.strokeWeight(3);
    const shieldY = CANVAS_HEIGHT - 130;
    p.line(0, shieldY, CANVAS_WIDTH, shieldY);
    
    // Shimmer effect
    for (let i = 0; i < 10; i++) {
      const shimmerX = (p.frameCount * 3 + i * 60) % CANVAS_WIDTH;
      p.stroke(150, 220, 255, 200);
      p.strokeWeight(2);
      p.line(shimmerX, shieldY - 5, shimmerX + 10, shieldY + 5);
    }
    p.pop();
  }
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw zombirds
  for (const zombird of gameState.zombirds) {
    zombird.draw(p);
  }
  
  // Draw bolts
  for (const bolt of gameState.bolts) {
    bolt.draw(p);
  }
  
  // Draw particles
  drawParticles(p);
  
  // Draw UI
  drawUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  
  // Wave
  p.fill(255, 200, 50);
  p.textSize(16);
  p.text(`Wave: ${gameState.wave}`, 10, 10);
  
  // Score
  p.fill(200, 255, 200);
  p.text(`Score: ${gameState.score}`, 10, 30);
  
  // Coins
  p.fill(255, 215, 0);
  p.text(`Coins: ${gameState.coins}`, 10, 50);
  
  // Pumpkins health
  p.fill(255, 140, 0);
  p.textSize(14);
  let pumpkinText = "Pumpkins: ";
  for (const pumpkin of gameState.pumpkins) {
    pumpkinText += "♥".repeat(pumpkin.health);
    if (pumpkin.health === 0) pumpkinText += "✗";
    pumpkinText += " ";
  }
  p.text(pumpkinText, 10, 70);
  
  // Power-up indicators
  if (gameState.upgrades.multiShotUnlocked) {
    const isActive = gameState.multiShotDuration > 0;
    const isReady = gameState.multiShotCooldown === 0;
    p.fill(...(isActive ? [100, 255, 100] : isReady ? [255, 255, 100] : [100, 100, 100]));
    p.textSize(12);
    p.text(`Multi-Shot (SHIFT)`, CANVAS_WIDTH - 140, 10);
    if (!isReady) {
      const cooldownSec = Math.ceil(gameState.multiShotCooldown / 60);
      p.text(`${cooldownSec}s`, CANVAS_WIDTH - 30, 10);
    }
  }
  
  if (gameState.upgrades.shieldUnlocked) {
    const isActive = gameState.shieldDuration > 0;
    const isReady = gameState.shieldCooldown === 0;
    p.fill(...(isActive ? [100, 255, 255] : isReady ? [255, 255, 100] : [100, 100, 100]));
    p.textSize(12);
    p.text(`Shield (Z)`, CANVAS_WIDTH - 140, 30);
    if (!isReady) {
      const cooldownSec = Math.ceil(gameState.shieldCooldown / 60);
      p.text(`${cooldownSec}s`, CANVAS_WIDTH - 30, 30);
    }
  }
  
  // Aim indicator
  p.fill(255, 255, 255, 150);
  p.textSize(12);
  const aimText = ["UP", "RIGHT", "DOWN", "LEFT"][gameState.aimDirection];
  p.text(`Aim: ${aimText}`, 10, 95);
}

export function drawGameOverScreen(p) {
  p.background(20, 10, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", 300, 100);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", 300, 100);
  }
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text(`Waves Survived: ${gameState.wave}`, 300, 160);
  p.text(`Final Score: ${gameState.score}`, 300, 190);
  p.text(`Zombirds Killed: ${gameState.zombirdsKilled}`, 300, 220);
  p.text(`Coins Earned: ${gameState.coins}`, 300, 250);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", 300, 330);
}

export function drawWaveCompleteScreen(p) {
  drawGame(p);
  drawUpgradeScreen(p);
}