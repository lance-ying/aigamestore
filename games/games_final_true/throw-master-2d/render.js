// render.js - Rendering logic

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { particleSystem } from './game.js';

export function renderGame(p) {
  // Clear background
  p.background(40, 60, 40);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOverWinScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverLoseScreen(p);
  }
}

function renderStartScreen(p) {
  // The main title, description, and controls are now handled by index.html elements.
  // This function will only draw the canvas background for the start screen.
  // No text drawing is needed here to avoid duplication.
  p.fill(255); // Keep fill for potential future canvas-only elements or effects
  p.textAlign(p.CENTER, p.CENTER); // Keep alignment for consistency
}

function renderPlayingScreen(p) {
  // Render game entities
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  for (const barrel of gameState.barrels) {
    barrel.draw(p);
  }
  
  for (const box of gameState.boxes) {
    box.draw(p);
  }
  
  for (const hostage of gameState.hostages) {
    hostage.draw(p);
  }
  
  for (const enemy of gameState.enemies) {
    if (enemy.active) {
      enemy.draw(p);
    }
  }
  
  for (const knife of gameState.knives) {
    knife.draw(p);
  }
  
  // Render particle effects
  if (particleSystem) {
    particleSystem.draw(p);
  }
  
  // Render UI
  renderUI(p);
  
  // Render level complete message
  if (gameState.showLevelComplete) {
    renderLevelCompleteOverlay(p);
  }
}

function renderUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text(`SCORE: ${String(gameState.score).padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Enemies remaining
  p.textSize(14);
  p.text(`Enemies: ${gameState.enemiesRemaining}`, 10, 35);
  
  // Hostages alive (only show if there are hostages in this level)
  if (gameState.hostages.length > 0) {
    p.fill(100, 150, 255);
    p.text(`Hostages Safe: ${gameState.hostagesAlive}`, 10, 55);
  }
}

function renderPauseOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 40);
}

function renderLevelCompleteOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Level complete message
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(20);
  p.text("+100 points", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  const remainingTime = Math.ceil((gameState.levelTransitionDuration - gameState.levelTransitionTimer) / 60);
  p.textSize(16);
  p.text(`Next level in ${remainingTime}...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverWinScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Win message
  p.textSize(48);
  p.fill(100, 255, 100);
  p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
  
  p.textSize(32);
  p.fill(255, 255, 100);
  p.text("YOU WIN!", CANVAS_WIDTH / 2, 150);
  
  // Final score
  p.textSize(24);
  p.fill(255);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(16);
  p.fill(200);
  p.text("+500 Game Completion Bonus", CANVAS_WIDTH / 2, 250);
  
  // Instructions
  p.textSize(20);
  p.fill(255, 255, 150);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

function renderGameOverLoseScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Lose message
  p.textSize(48);
  p.fill(255, 100, 100);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.textSize(20);
  p.fill(255);
  p.text("A hostage was killed!", CANVAS_WIDTH / 2, 170);
  
  // Final score
  p.textSize(24);
  p.fill(255);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  // Instructions
  p.textSize(20);
  p.fill(255, 255, 150);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}