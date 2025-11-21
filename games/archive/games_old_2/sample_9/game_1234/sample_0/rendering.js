// rendering.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 40);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(200, 100, 100);
  p.text('HOLE.IO', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(220);
  p.text('Consume everything in your path!', CANVAS_WIDTH / 2, 140);
  p.text('Grow your black hole by swallowing objects and opponents.', CANVAS_WIDTH / 2, 160);
  p.text('Be the largest black hole when time runs out!', CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.fill(180);
  p.text('ARROW KEYS: Move', CANVAS_WIDTH / 2, 220);
  p.text('ESC: Pause', CANVAS_WIDTH / 2, 240);
  p.text('R: Restart', CANVAS_WIDTH / 2, 260);
  
  // High score
  p.textSize(16);
  p.fill(255, 220, 100);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 300);
  
  // Start prompt
  p.textSize(20);
  p.fill(100, 255, 100);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
  }
}

export function renderPlaying(p) {
  // Background
  p.background(40, 45, 50);
  
  // Draw road lines
  p.stroke(60, 65, 70);
  p.strokeWeight(2);
  for (let i = 0; i < CANVAS_WIDTH; i += 40) {
    p.line(i, 0, i, CANVAS_HEIGHT);
  }
  for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Render consumables
  for (let obj of gameState.consumableObjects) {
    obj.render(p);
  }
  
  // Render AI black holes
  for (let bh of gameState.aiBlackHoles) {
    bh.render(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // UI
  renderUI(p);
}

export function renderUI(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255);
  p.noStroke();
  
  // Score
  p.textSize(18);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Timer
  p.textAlign(p.CENTER, p.TOP);
  const timeLeft = Math.max(0, gameState.levelTimer);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  p.text(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 10);
  
  // Level
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, CANVAS_HEIGHT - 10);
  
  // Player size indicator
  if (gameState.player) {
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text(`SIZE: ${Math.floor(gameState.player.radius)}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  }
  
  p.pop();
}

export function renderPaused(p) {
  renderPlaying(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  // Small paused indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255, 220, 100);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p) {
  p.background(20, 20, 30);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (gameState.currentLevel >= gameState.totalLevels) {
      // Full game win
      p.textSize(48);
      p.fill(100, 255, 100);
      p.text('YOU WIN!', CANVAS_WIDTH / 2, 100);
      
      p.textSize(24);
      p.fill(255, 220, 100);
      p.text('YOU CONQUERED THE CITY!', CANVAS_WIDTH / 2, 160);
    } else {
      // Level complete
      p.textSize(36);
      p.fill(100, 255, 100);
      p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 100);
      
      p.textSize(18);
      p.fill(200);
      p.text('Press ENTER to continue', CANVAS_WIDTH / 2, 160);
    }
  } else {
    // Game over lose
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
    
    p.textSize(18);
    p.fill(200);
    p.text('You were swallowed or not the largest!', CANVAS_WIDTH / 2, 160);
  }
  
  // Final score
  p.textSize(24);
  p.fill(255);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  // High score
  p.textSize(18);
  p.fill(255, 220, 100);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 260);
  
  // Restart prompt
  p.textSize(20);
  p.fill(150, 200, 255);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 330);
  }
}