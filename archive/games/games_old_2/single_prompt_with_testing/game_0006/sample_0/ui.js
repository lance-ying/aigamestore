// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, GENRE_TYPES } from './globals.js';

export function drawUI(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawPlayingUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingUI(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  p.background(20, 20, 40);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("GENRE SHIFT", p.width / 2, 60);
  
  // Subtitle
  p.fill(150, 150, 200);
  p.textSize(16);
  p.text("A Time-Bending Adventure", p.width / 2, 100);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Journey through time and gaming eras!\nExperience multiple genres as you collect temporal crystals.\nAdapt your playstyle to overcome challenges.";
  p.text(desc, p.width / 2, 140, 500);
  
  // Instructions
  p.fill(255, 255, 150);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CONTROLS:", 50, 220);
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Arrow Keys: Move character", 70, 245);
  p.text("Space: Context action (shoot/interact/play card)", 70, 265);
  p.text("Z: Dash ability (exploration mode)", 70, 285);
  p.text("ESC: Pause game", 70, 305);
  p.text("R: Restart game", 70, 325);
  
  // Objective
  p.fill(255, 255, 150);
  p.textSize(14);
  p.text("OBJECTIVE:", 50, 355);
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Collect all 5 temporal crystals and reach the final portal!", 70, 375);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS ENTER TO START", p.width / 2, p.height - 30);
  
  p.pop();
}

function drawPlayingUI(p) {
  p.push();
  
  // Health bar
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(10, 10, 150, 20);
  p.fill(255, 0, 0);
  p.rect(10, 10, 150 * (gameState.playerHealth / gameState.maxHealth), 20);
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`HP: ${Math.max(0, Math.floor(gameState.playerHealth))}/${gameState.maxHealth}`, 15, 20);
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 40);
  
  // Crystals
  p.fill(100, 255, 255);
  p.text(`Crystals: ${gameState.crystalsCollected}/${gameState.totalCrystals}`, 10, 60);
  
  // Current genre
  p.fill(255, 255, 150);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`Genre: ${gameState.currentGenre}`, p.width - 10, 10);
  
  // Dash cooldown
  if (gameState.dashCooldown > 0) {
    p.fill(150, 150, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Dash: ${Math.ceil(gameState.dashCooldown / 60)}s`, p.width - 10, 30);
  } else {
    p.fill(100, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("Dash: Ready", p.width - 10, 30);
  }
  
  p.pop();
}

function drawPausedOverlay(p) {
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", p.width - 10, 60);
  p.pop();
}

function drawGameOverScreen(p) {
  p.push();
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", p.width / 2, 100);
  
  // Message
  p.fill(220, 220, 220);
  p.textSize(18);
  if (isWin) {
    p.text("You restored the spacetime continuum!", p.width / 2, 160);
    p.text("All temporal crystals collected!", p.width / 2, 190);
  } else {
    p.text("Your journey ends here...", p.width / 2, 160);
    p.text("The timeline remains fractured.", p.width / 2, 190);
  }
  
  // Stats
  p.fill(255, 255, 150);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, p.width / 2, 240);
  p.text(`Crystals Collected: ${gameState.crystalsCollected}/${gameState.totalCrystals}`, 
         p.width / 2, 270);
  
  // Restart prompt
  p.fill(100, 200, 255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", p.width / 2, p.height - 50);
  
  p.pop();
}