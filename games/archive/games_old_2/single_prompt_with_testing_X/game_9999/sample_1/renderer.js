// renderer.js - Rendering functions

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CANVAS_WIDTH, CANVAS_HEIGHT, CHAMPION_ABILITY_COOLDOWN } from './globals.js';
import { getRank } from './game_logic.js';

export function renderGame(p) {
  p.background(20, 20, 30);
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MOB CONTROL", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text("Guide your units through multiplier gates", CANVAS_WIDTH / 2, 140);
  p.text("to destroy the enemy base!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(14);
  p.fill(180, 180, 200);
  p.textAlign(p.LEFT, p.CENTER);
  const startX = 100;
  let y = 200;
  
  p.text("← → : Aim cannon", startX, y); y += 25;
  p.text("A / D : Fine aim", startX, y); y += 25;
  p.text("SPACE : Fire units (hold to stream)", startX, y); y += 25;
  p.text("Q : Champion ability", startX, y); y += 25;
  p.text("E : Swap Champion", startX, y); y += 25;
  p.text("SHIFT : Slow-motion aim", startX, y); y += 25;
  p.text("Z : Restart level", startX, y);
  
  // Objective
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 200, 100);
  p.textSize(16);
  p.text("Thread units through BLUE gates to multiply!", CANVAS_WIDTH / 2, 340);
  p.text("Avoid RED gates that divide your army!", CANVAS_WIDTH / 2, 365);
  
  // Start prompt
  p.fill(100, 255, 150);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const alpha = p.map(i, 0, CANVAS_HEIGHT, 30, 50);
    p.stroke(20, 20, alpha);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Render entities
  gameState.entities.forEach(entity => {
    if (entity.render) entity.render(p);
  });
  
  // Render cannon
  if (gameState.cannon) {
    gameState.cannon.render(p);
  }
  
  // Render units
  gameState.units.forEach(unit => {
    if (unit.alive) unit.render(p);
  });
  
  // UI
  renderUI(p);
  
  // Log player info
  if (p.frameCount % 10 === 0 && gameState.cannon) {
    p.logs.player_info.push({
      screen_x: gameState.cannon.x,
      screen_y: gameState.cannon.y,
      game_x: gameState.cannon.x,
      game_y: gameState.cannon.y,
      framecount: p.frameCount
    });
  }
}

function renderUI(p) {
  p.push();
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Level: ${gameState.level}`, 10, 35);
  
  // Unit count
  const unitCount = gameState.units.filter(u => u.alive).length;
  p.text(`Units: ${unitCount}`, 10, 60);
  
  // Champion info
  const champion = gameState.champions[gameState.selectedChampion];
  p.textSize(14);
  p.fill(255, 200, 100);
  p.text(`Champion: ${champion.name}`, CANVAS_WIDTH - 150, 10);
  p.textSize(12);
  p.fill(200, 200, 220);
  p.text(champion.description, CANVAS_WIDTH - 150, 30);
  
  // Cooldown bar
  if (gameState.abilityOnCooldown) {
    const cooldownPercent = gameState.abilityCooldownTimer / CHAMPION_ABILITY_COOLDOWN;
    p.fill(50, 50, 50);
    p.rect(CANVAS_WIDTH - 150, 50, 140, 10);
    p.fill(255, 100, 100);
    p.rect(CANVAS_WIDTH - 150, 50, 140 * (1 - cooldownPercent), 10);
  } else {
    p.fill(100, 255, 150);
    p.text("[Q] READY", CANVAS_WIDTH - 150, 50);
  }
  
  // Slow motion indicator
  if (gameState.slowMotion) {
    p.fill(100, 200, 255);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.text("SLOW-MO", CANVAS_WIDTH / 2, 10);
  }
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  // Draw final game state faded
  p.push();
  p.tint(255, 100);
  renderPlayingScreen(p);
  p.pop();
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 150);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    const rank = getRank(gameState.score);
    p.textSize(72);
    p.fill(255, 220, 100);
    p.text(`RANK ${rank}`, CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
  }
  
  // Score breakdown
  p.textSize(20);
  p.fill(255, 255, 255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  p.textSize(14);
  p.fill(200, 200, 220);
  p.text(`Blue Gates: ${gameState.blueGatesPassed}`, CANVAS_WIDTH / 2, 270);
  p.text(`Units Reached Base: ${gameState.unitsReachedBase}`, CANVAS_WIDTH / 2, 290);
  p.text(`Red Gates Hit: ${gameState.redGatesPassed}`, CANVAS_WIDTH / 2, 310);
  
  // Continue prompt
  p.textSize(18);
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 150);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
  
  p.fill(200, 200, 220);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
  
  p.pop();
}