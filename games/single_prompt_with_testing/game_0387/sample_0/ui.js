// ui.js - User interface rendering

import { CANVAS_WIDTH, GAME_PHASES, gameState } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameUI(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, 400);

  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GLADIATOR", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.text("Arena of Champions", CANVAS_WIDTH / 2, 120);

  // Description
  p.fill(255);
  p.textSize(14);
  p.text("Fight for your freedom!", CANVAS_WIDTH / 2, 160);
  p.text("Defeat enemies in each arena tier to advance.", CANVAS_WIDTH / 2, 180);
  p.text("Win in the Grand Stadium to earn your freedom!", CANVAS_WIDTH / 2, 200);

  // Instructions
  p.textSize(16);
  p.fill(200, 255, 200);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 240);
  
  p.textSize(13);
  p.fill(255);
  p.text("Arrow Keys: Move & Jump", CANVAS_WIDTH / 2, 265);
  p.text("Z: Attack (use momentum for power!)", CANVAS_WIDTH / 2, 285);
  p.text("SPACE: Block (reduces damage)", CANVAS_WIDTH / 2, 305);
  p.text("SHIFT: Sprint (build momentum)", CANVAS_WIDTH / 2, 325);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 345);

  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }

  p.pop();
}

function renderGameUI(p) {
  p.push();

  // Semi-transparent background for UI
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 40);

  // Arena name
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(gameState.arenaName, CANVAS_WIDTH / 2, 5);

  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 22);

  // Gold
  p.fill(255, 215, 0);
  p.text(`Gold: ${gameState.gold}`, 120, 22);

  // Enemies remaining
  p.fill(200, 100, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Enemies: ${gameState.totalEnemiesInTier - gameState.defeatedEnemies}/${gameState.totalEnemiesInTier}`, CANVAS_WIDTH - 10, 22);

  // Player health bar
  if (gameState.player) {
    const barWidth = 150;
    const barHeight = 15;
    const barX = 10;
    const barY = 45;

    p.fill(100, 0, 0);
    p.rect(barX, barY, barWidth, barHeight);
    
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    const healthColor = healthPercent > 0.5 ? [0, 200, 0] : healthPercent > 0.25 ? [255, 200, 0] : [255, 0, 0];
    p.fill(...healthColor);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);

    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, barX + 5, barY + 2);
  }

  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, 400);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

  // Title
  p.fill(isWin ? [255, 215, 0] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);

  // Message
  p.fill(255);
  p.textSize(20);
  if (isWin) {
    p.text("You have earned your FREEDOM!", CANVAS_WIDTH / 2, 160);
    p.text("The crowd chants your name!", CANVAS_WIDTH / 2, 190);
  } else {
    p.text("You have fallen in the arena.", CANVAS_WIDTH / 2, 160);
    p.text("Your story ends here...", CANVAS_WIDTH / 2, 190);
  }

  // Stats
  p.textSize(16);
  p.fill(200);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 265);
  p.text(`Enemies Defeated: ${gameState.defeatedEnemies}`, CANVAS_WIDTH / 2, 290);
  p.text(`Arena Reached: ${gameState.arenaName}`, CANVAS_WIDTH / 2, 315);

  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  }

  p.pop();
}