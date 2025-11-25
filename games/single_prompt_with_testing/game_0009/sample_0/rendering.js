// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PLAYER_SPAWN_X_MIN, PLAYER_SPAWN_X_MAX, WAVE_CONFIG, BASIC_UNIT_COST, STRONG_UNIT_COST } from './globals.js';

export function drawBackground(p) {
  // Sky gradient
  for (let y = 0; y < GROUND_Y; y++) {
    const inter = y / GROUND_Y;
    const c = p.lerpColor(p.color(100, 150, 200), p.color(180, 200, 220), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground
  p.noStroke();
  p.fill(80, 60, 40);
  p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  
  // Grass texture
  p.fill(60, 100, 40);
  for (let x = 0; x < CANVAS_WIDTH; x += 10) {
    p.rect(x, GROUND_Y, 8, 3);
  }
  
  // Spawn zones
  p.fill(200, 50, 50, 30);
  p.rect(PLAYER_SPAWN_X_MIN - 10, GROUND_Y - 40, PLAYER_SPAWN_X_MAX - PLAYER_SPAWN_X_MIN + 20, 40);
  
  p.fill(50, 100, 200, 30);
  p.rect(CANVAS_WIDTH - 150, GROUND_Y - 40, 120, 40);
}

export function drawUI(p) {
  p.push();
  
  // Score and points
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${Math.floor(gameState.score)}`, 10, 10);
  p.text(`Points: ${Math.floor(gameState.points)}`, 10, 30);
  p.text(`Wave: ${gameState.currentWave + 1}/${WAVE_CONFIG.length}`, 10, 50);
  
  // Unit costs
  p.textSize(12);
  p.text(`[SPACE] Basic (${BASIC_UNIT_COST})`, 10, 75);
  p.text(`[SHIFT] Strong (${STRONG_UNIT_COST})`, 10, 90);
  
  // Wave info
  if (gameState.betweenWaves) {
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.fill(255, 255, 100);
    p.text(`Wave ${gameState.currentWave} Complete!`, CANVAS_WIDTH / 2, 100);
    p.textSize(16);
    p.text(`Next wave incoming...`, CANVAS_WIDTH / 2, 130);
  }
  
  // Cursor indicator
  p.fill(200, 50, 50, 150);
  p.noStroke();
  p.triangle(
    gameState.cursorX, GROUND_Y - 45,
    gameState.cursorX - 8, GROUND_Y - 55,
    gameState.cursorX + 8, GROUND_Y - 55
  );
  
  p.pop();
}

export function drawStartScreen(p) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(200, 50, 50);
  p.textSize(48);
  p.text("WOBBLE BATTLE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255);
  p.textSize(20);
  p.text("Physics-Based Army Combat", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(220);
  
  const instructions = [
    "Deploy wobbly warriors to defend against enemy waves!",
    "",
    "CONTROLS:",
    "← → : Move spawn cursor",
    "SPACE: Deploy basic wobbler (100 pts)",
    "SHIFT: Deploy strong wobbler (250 pts)",
    "",
    "OBJECTIVE:",
    "Defeat all 5 waves of enemies!",
    "Don't let enemies reach your base!",
    "Earn points over time to deploy more units."
  ];
  
  let yPos = 170;
  for (let line of instructions) {
    p.text(line, CANVAS_WIDTH / 2 - 200, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(24);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

export function drawPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 150);
    
    p.fill(255);
    p.textSize(24);
    p.text("All waves defeated!", CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEAT", CANVAS_WIDTH / 2, 150);
    
    p.fill(255);
    p.textSize(24);
    p.text("Enemies broke through!", CANVAS_WIDTH / 2, 200);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 250);
  p.text(`Enemies Defeated: ${gameState.totalEnemiesDefeated}`, CANVAS_WIDTH / 2, 280);
  p.text(`Waves Cleared: ${gameState.currentWave}/${WAVE_CONFIG.length}`, CANVAS_WIDTH / 2, 310);
  
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function renderGame(p) {
  p.background(100, 150, 200);
  
  const phase = gameState.gamePhase;
  
  if (phase === PHASE_START) {
    drawStartScreen(p);
  } else if (phase === PHASE_PLAYING || phase === PHASE_PAUSED) {
    drawBackground(p);
    
    // Draw all entities
    for (let entity of gameState.entities) {
      entity.draw(p);
    }
    
    drawUI(p);
    
    if (phase === PHASE_PAUSED) {
      drawPausedIndicator(p);
    }
  } else if (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE) {
    drawBackground(p);
    
    // Draw all entities
    for (let entity of gameState.entities) {
      entity.draw(p);
    }
    
    drawUI(p);
    drawGameOverScreen(p, phase === PHASE_GAME_OVER_WIN);
  }
}