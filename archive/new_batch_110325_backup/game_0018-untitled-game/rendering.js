// rendering.js - Game rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p) {
  p.background(135, 206, 235); // Sky blue
  
  // Ocean waves
  p.fill(30, 144, 255);
  for (let i = 0; i < 3; i++) {
    const waveY = 250 + i * 30;
    p.beginShape();
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const y = waveY + Math.sin((x + p.frameCount * 2 + i * 50) * 0.02) * 10;
      p.vertex(x, y);
    }
    p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.vertex(0, CANVAS_HEIGHT);
    p.endShape(p.CLOSE);
  }
  
  // Title
  p.fill(40, 20, 10);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text('MathLand', CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.text('Pirate Adventure', CANVAS_WIDTH / 2, 110);
  
  // Description
  p.textSize(14);
  p.fill(60, 40, 20);
  p.text('Help Ray recover the stolen sacred stones!', CANVAS_WIDTH / 2, 150);
  p.text('Navigate islands, solve math puzzles, and avoid hazards.', CANVAS_WIDTH / 2, 170);
  
  // Instructions
  p.textSize(12);
  p.fill(40, 20, 10);
  p.text('CONTROLS:', CANVAS_WIDTH / 2, 210);
  p.text('Arrow Keys: Move & Jump', CANVAS_WIDTH / 2, 230);
  p.text('Shift: Sprint', CANVAS_WIDTH / 2, 250);
  p.text('Z: Interact with chests', CANVAS_WIDTH / 2, 270);
  p.text('Space: Select puzzle answer', CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.textSize(18);
  p.fill(200, 50, 50);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  }
}

export function drawPlayingScreen(p) {
  // Background
  p.background(135, 206, 235);
  
  // Ground/ocean
  p.fill(76, 175, 80);
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Platforms
  gameState.platforms.forEach(platform => platform.draw(p));
  
  // Collectibles
  gameState.collectibles.forEach(collectible => collectible.draw(p));
  
  // Hazards
  gameState.hazards.forEach(hazard => hazard.draw(p));
  
  // Chests
  gameState.chests.forEach(chest => chest.draw(p));
  
  // Enemies
  gameState.entities.forEach(entity => {
    if (entity !== gameState.player && entity.draw) {
      entity.draw(p);
    }
  });
  
  // Player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // UI
  drawUI(p);
  
  // Math puzzle overlay
  if (gameState.puzzleActive && gameState.mathPuzzle) {
    gameState.mathPuzzle.draw(p);
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Small indicator in top right
  p.textAlign(p.RIGHT);
  p.textSize(14);
  p.fill(255, 255, 255);
  p.text('PAUSED', CANVAS_WIDTH - 10, 20);
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Stars background
  for (let i = 0; i < 50; i++) {
    const x = (i * 37) % CANVAS_WIDTH;
    const y = (i * 67) % CANVAS_HEIGHT;
    const brightness = 150 + (Math.sin(p.frameCount * 0.05 + i) * 50);
    p.fill(brightness, brightness, brightness);
    p.ellipse(x, y, 2, 2);
  }
  
  p.textAlign(p.CENTER);
  
  if (isWin) {
    p.fill(255, 215, 0);
    p.textSize(48);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text('All sacred stones recovered!', CANVAS_WIDTH / 2, 160);
    p.text('MathLand is saved!', CANVAS_WIDTH / 2, 190);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text('Ray was defeated...', CANVAS_WIDTH / 2, 160);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  p.text(`Sacred Stones: ${gameState.sacredStones}/${gameState.totalStones}`, CANVAS_WIDTH / 2, 260);
  
  // Restart prompt
  p.textSize(18);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  }
}

function drawUI(p) {
  // Health bar
  p.fill(50, 50, 50);
  p.rect(10, 10, 104, 24);
  
  const healthPercent = gameState.health / gameState.maxHealth;
  const healthColor = healthPercent > 0.5 ? [100, 200, 100] : healthPercent > 0.25 ? [255, 200, 0] : [255, 100, 100];
  p.fill(...healthColor);
  p.rect(12, 12, 100 * healthPercent, 20);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(gameState.health)}`, 15, 26);
  
  // Score
  p.fill(50, 50, 50);
  p.rect(CANVAS_WIDTH - 114, 10, 104, 24);
  p.fill(255, 215, 0);
  p.textAlign(p.RIGHT);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 15, 26);
  
  // Sacred stones counter
  p.fill(50, 50, 50);
  p.rect(CANVAS_WIDTH - 114, 40, 104, 24);
  p.fill(100, 200, 255);
  p.textAlign(p.RIGHT);
  p.text(`Stones: ${gameState.sacredStones}/${gameState.totalStones}`, CANVAS_WIDTH - 15, 56);
  
  // Level indicator
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT);
  p.textSize(12);
  p.text(`Level ${gameState.currentLevel + 1}`, 10, 50);
  
  // Spyglass indicator
  if (gameState.hasSpyglass) {
    p.fill(150, 200, 255);
    p.text('🔭 Spyglass', 10, 70);
  }
}