// rendering.js - Game rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, MAX_ESCAPED_ENEMIES } from './globals.js';
import { renderPath } from './pathGenerator.js';
import { renderWaveInfo } from './waveManager.js';
import { renderUI } from './ui.js';

export function renderGame(p) {
  // Clear background
  p.background(40, 60, 50);
  
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlayingScreen(p);
      break;
    case PHASE_PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    default:
      if (gameState.gamePhase.includes("GAME_OVER")) {
        renderGameOverScreen(p);
      }
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(220, 180, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("GUNS'N'GLORY", CANVAS_WIDTH / 2, 80);
  
  p.textSize(18);
  p.fill(180, 150, 80);
  p.text("TOWER DEFENSE", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Deploy bandit units to ambush pioneer waves!",
    "",
    "Earn gold from defeated enemies to recruit",
    "new units and upgrade their damage and range.",
    "",
    "Don't let more than 10 enemies escape!"
  ];
  
  let yPos = 160;
  for (const line of desc) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  // Controls
  p.fill(150, 200, 150);
  p.textSize(13);
  yPos = 290;
  const controls = [
    "Space: Select/Confirm unit",
    "Arrow Keys: Move unit or navigate menu",
    "Z: Open recruit/upgrade menu",
    "Shift: Cancel selection",
  ];
  
  for (const line of controls) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Render path
  if (gameState.paths && gameState.paths.length > 0) {
    renderPath(p, gameState.paths);
  }
  
  // Render entities
  for (const entity of gameState.entities) {
    if (entity.render) {
      entity.render(p);
    }
  }
  
  // Render power-ups
  for (const powerUp of gameState.powerUps) {
    if (!powerUp.collected && powerUp.lifetime > 0) {
      powerUp.render(p);
    }
  }
  
  // Render UI
  renderWaveInfo(p);
  renderUI(p);
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Background
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(isWin ? 100 : 200, isWin ? 200 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 210);
  p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 240);
  
  // Message
  p.textSize(14);
  if (isWin) {
    p.text("You defended the frontier successfully!", CANVAS_WIDTH / 2, 280);
  } else {
    p.text(`Too many enemies escaped (${gameState.escapedEnemies}/${MAX_ESCAPED_ENEMIES})`, CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}