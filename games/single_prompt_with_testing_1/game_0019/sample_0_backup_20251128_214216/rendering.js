// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 120, 200);
  
  // Title
  p.fill(255, 220, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.textStyle(p.BOLD);
  p.text("SpongeBob:", CANVAS_WIDTH / 2, 80);
  p.text("Cosmic Shake", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  p.text("Navigate cosmic platforms and collect coins!", CANVAS_WIDTH / 2, 170);
  p.text("Unlock abilities to reach new areas", CANVAS_WIDTH / 2, 190);
  
  // Controls
  p.textSize(12);
  p.textAlign(p.LEFT);
  p.text("Controls:", 150, 230);
  p.text("Arrow Keys/WASD - Move", 150, 250);
  p.text("Space - Jump", 150, 270);
  p.text("Z - Karate Kick (unlock at 25 coins)", 150, 290);
  p.text("Shift - Hook-Swing (unlock at 100 coins)", 150, 310);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER);
  p.textSize(20);
  if (p.frameCount % 60 < 30) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderGame(p) {
  // Sky background with gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 250), p.color(70, 130, 180), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Render coins
  gameState.coins.forEach(coin => {
    if (!coin.collected) {
      coin.render();
    }
  });
  
  // Render checkpoints
  gameState.checkpoints.forEach(checkpoint => {
    checkpoint.render();
  });
  
  // Render swing points
  gameState.swingPoints.forEach(swing => {
    swing.render();
  });
  
  // Render portal
  if (gameState.portal) {
    gameState.portal.render();
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // UI
  renderUI(p);
}

export function renderUI(p) {
  // Health hearts
  p.fill(255, 0, 0);
  p.noStroke();
  for (let i = 0; i < gameState.health; i++) {
    p.push();
    p.translate(20 + i * 30, 20);
    // Heart shape
    p.beginShape();
    p.vertex(0, 5);
    p.bezierVertex(-5, 0, -10, 5, 0, 15);
    p.bezierVertex(10, 5, 5, 0, 0, 5);
    p.endShape(p.CLOSE);
    p.pop();
  }
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`Coins: ${Math.floor(gameState.score / 10)}`, 20, 60);
  
  // Abilities
  p.textSize(12);
  let yOffset = 80;
  
  if (gameState.abilities.karateKick) {
    p.fill(255, 255, 0);
    p.text("✓ Karate Kick (Z)", 20, yOffset);
    yOffset += 20;
  }
  
  if (gameState.abilities.doubleJump) {
    p.fill(255, 255, 0);
    p.text("✓ Double Jump", 20, yOffset);
    yOffset += 20;
  }
  
  if (gameState.abilities.hookSwing) {
    p.fill(255, 255, 0);
    p.text("✓ Hook-Swing (Shift)", 20, yOffset);
    yOffset += 20;
  }
  
  // Show next unlock
  if (!gameState.abilities.karateKick) {
    p.fill(180);
    p.text(`Next: Karate Kick (${gameState.abilityThresholds.karateKick / 10} coins)`, 20, yOffset);
  } else if (!gameState.abilities.doubleJump) {
    p.fill(180);
    p.text(`Next: Double Jump (${gameState.abilityThresholds.doubleJump / 10} coins)`, 20, yOffset);
  } else if (!gameState.abilities.hookSwing) {
    p.fill(180);
    p.text(`Next: Hook-Swing (${gameState.abilityThresholds.hookSwing / 10} coins)`, 20, yOffset);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(255, 255, 0);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text("All abilities unlocked!", CANVAS_WIDTH / 2, 180);
    p.text(`Final Score: ${Math.floor(gameState.score / 10)} coins`, CANVAS_WIDTH / 2, 220);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text(`You collected: ${Math.floor(gameState.score / 10)} coins`, CANVAS_WIDTH / 2, 180);
  }
  
  p.fill(255);
  p.textSize(18);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 280);
  
  // Show abilities unlocked
  p.textSize(14);
  let yPos = 320;
  p.text("Abilities Unlocked:", CANVAS_WIDTH / 2, yPos);
  yPos += 25;
  
  if (gameState.abilities.karateKick) {
    p.fill(255, 255, 0);
    p.text("✓ Karate Kick", CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  if (gameState.abilities.doubleJump) {
    p.fill(255, 255, 0);
    p.text("✓ Double Jump", CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  if (gameState.abilities.hookSwing) {
    p.fill(255, 255, 0);
    p.text("✓ Hook-Swing", CANVAS_WIDTH / 2, yPos);
  }
}