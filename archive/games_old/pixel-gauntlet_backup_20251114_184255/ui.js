import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  p.push();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  // Score
  const scoreText = `SCORE: ${String(gameState.score).padStart(5, '0')}`;
  p.text(scoreText, 20, 20);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH - 20, 20);
  
  // Health bar
  if (gameState.player) {
    p.textAlign(p.LEFT, p.TOP);
    p.text('HP:', 20, 50);
    
    const barWidth = 150;
    const barHeight = 20;
    const barX = 55;
    const barY = 50;
    
    p.fill(100, 0, 0);
    p.rect(barX, barY, barWidth, barHeight);
    
    const hpPercent = gameState.player.hp / gameState.player.maxHP;
    p.fill(0, 200, 0);
    p.rect(barX, barY, barWidth * hpPercent, barHeight);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${gameState.player.hp}/${gameState.player.maxHP}`, barX + barWidth / 2, barY + barHeight / 2);
  }
  
  // Paused indicator
  if (gameState.gamePhase === 'PAUSED') {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 0);
    p.text('PAUSED', CANVAS_WIDTH - 20, 50);
  }
  
  p.pop();
}

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text('PIXEL GAUNTLET', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.text('Navigate through 5 challenging levels', CANVAS_WIDTH / 2, 140);
  p.text('Defeat enemies and collect power-ups', CANVAS_WIDTH / 2, 160);
  p.text('to reach the final boss!', CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructionsX = 100;
  let instructionsY = 220;
  p.text('CONTROLS:', instructionsX, instructionsY);
  instructionsY += 20;
  p.text('Arrow Keys / WASD - Move', instructionsX, instructionsY);
  instructionsY += 18;
  p.text('Space / W / Up - Jump', instructionsX, instructionsY);
  instructionsY += 18;
  p.text('Z / Shift - Attack', instructionsX, instructionsY);
  instructionsY += 18;
  p.text('ESC - Pause', instructionsX, instructionsY);
  instructionsY += 18;
  p.text('R - Restart', instructionsX, instructionsY);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(255, 255, 0);
  if (p.frameCount % 60 < 30) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
  }
}

export function renderGameOverScreen(p, win) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (win) {
    p.textSize(48);
    p.fill(255, 215, 0);
    p.text('YOU WIN!', CANVAS_WIDTH / 2, 120);
  } else {
    p.textSize(48);
    p.fill(255, 0, 0);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
  }
  
  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  p.textSize(20);
  p.fill(255, 255, 0);
  if (p.frameCount % 60 < 30) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 280);
  }
  
  p.pop();
}

export function renderLevelComplete(p) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 150);
  
  p.textSize(20);
  p.fill(255);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  p.textSize(16);
  if (p.frameCount % 60 < 30) {
    p.text('Loading next level...', CANVAS_WIDTH / 2, 260);
  }
  
  p.pop();
}