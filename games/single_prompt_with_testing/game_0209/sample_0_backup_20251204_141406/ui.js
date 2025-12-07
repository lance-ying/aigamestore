// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with shadow effect
  p.fill(0, 0, 0, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(52);
  p.text('SPELUNKY CAVE', CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  p.fill(255, 200, 50);
  p.textSize(52);
  p.text('SPELUNKY CAVE', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 160);
  p.textSize(18);
  p.text('Explore • Collect • Survive', CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 35, 50, 200);
  p.rect(CANVAS_WIDTH / 2 - 200, 160, 400, 160, 8);
  
  p.fill(255, 255, 200);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  const instructionsX = CANVAS_WIDTH / 2 - 180;
  let instructionsY = 175;
  
  p.text('Arrow Keys: Move and climb', instructionsX, instructionsY);
  instructionsY += 25;
  p.text('Space: Jump', instructionsX, instructionsY);
  instructionsY += 25;
  p.text('Z: Throw bomb (destroy blocks)', instructionsX, instructionsY);
  instructionsY += 25;
  p.text('Shift: Deploy rope (climb down)', instructionsX, instructionsY);
  instructionsY += 25;
  p.text('Collect all gems to unlock the exit!', instructionsX, instructionsY);
  
  // Start prompt (pulsing)
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, pulseAlpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.fill(255);
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Game over text
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(255, 255, 200);
    p.textSize(20);
    p.text('You escaped the caves!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(255, 255, 200);
    p.textSize(20);
    p.text('The caves claimed another soul...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  // Final score
  p.fill(255, 215, 0);
  p.textSize(28);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text(`Gems Collected: ${gameState.gemsCollected} / ${gameState.totalGems}`, 
         CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  
  // Restart instruction
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(255, 255, 255, pulseAlpha);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

export function renderHUD(p) {
  // Background for HUD
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Score
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Gems collected
  p.fill(255, 215, 0);
  p.text(`💎 ${gameState.gemsCollected}/${gameState.totalGems}`, 10, 28);
  
  if (gameState.player) {
    // Health hearts
    p.fill(255, 50, 50);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    let heartsText = '';
    for (let i = 0; i < gameState.player.health; i++) {
      heartsText += '❤️';
    }
    p.text(heartsText, 160, 10);
    
    // Items inventory
    p.fill(100, 100, 100);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    
    // Bombs
    p.fill(255);
    p.text(`💣 ${gameState.player.bombs}`, 160, 28);
    
    // Ropes
    p.text(`🪢 ${gameState.player.ropes}`, 220, 28);
  }
  
  // Exit door status
  if (gameState.exitDoor && !gameState.exitDoor.unlocked) {
    p.fill(255, 200, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('🔒 Collect all gems!', CANVAS_WIDTH - 10, 10);
  } else if (gameState.exitDoor && gameState.exitDoor.unlocked) {
    p.fill(100, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.15) * 100;
    p.fill(100, 255, 100, pulseAlpha);
    p.text('✓ Exit unlocked!', CANVAS_WIDTH - 10, 10);
  }
}