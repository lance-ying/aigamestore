// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, 
         PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderGameUI(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderGameUI(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(255, 100, 100, 100);
  p.textSize(48);
  p.text("STREETS OF FURY", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Main title
  p.fill(255, 50, 50);
  p.textSize(48);
  p.text("STREETS OF FURY", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text("Fight through waves of enemies!", CANVAS_WIDTH / 2, 140);
  p.text("Defeat the boss to win!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 200);
  
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const instructionX = 150;
  p.text("← → : Move", instructionX, 230);
  p.text("SPACE : Attack", instructionX, 250);
  p.text("Z : Special Attack (uses health)", instructionX, 270);
  p.text("SHIFT : Grab enemy", instructionX, 290);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
  }
  
  p.pop();
}

function renderGameUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  p.push();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  
  // Score
  p.fill(255, 255, 100);
  p.text(`SCORE: ${gameState.score}`, 10, 20);
  
  // Stage
  p.fill(150, 200, 255);
  p.text(`STAGE ${gameState.stage}/${gameState.totalStages}`, 150, 20);
  
  // Combo
  if (gameState.player && gameState.player.combo > 1) {
    p.fill(255, 100, 255);
    p.text(`COMBO x${gameState.player.combo}`, 280, 20);
  }
  
  // Health bar
  if (gameState.player) {
    p.fill(200);
    p.text("HEALTH", 410, 20);
    
    p.fill(100, 0, 0);
    p.rect(470, 10, 120, 20);
    
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    const healthColor = healthPercent > 0.5 ? [0, 255, 0] : 
                       healthPercent > 0.25 ? [255, 255, 0] : 
                       [255, 0, 0];
    p.fill(...healthColor);
    p.rect(470, 10, 120 * healthPercent, 20);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 530, 20);
  }
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.textSize(14);
  p.fill(200);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.pop();
}

function renderGameOverScreen(p) {
  p.background(20, 20, 40);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Result
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200);
    p.textSize(16);
    p.text("You defeated the boss!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(200);
    p.textSize(16);
    p.text("You were defeated...", CANVAS_WIDTH / 2, 170);
  }
  
  // Final stats
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 250);
  p.text(`Stage Reached: ${gameState.stage}/${gameState.totalStages}`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  }
  
  p.pop();
}