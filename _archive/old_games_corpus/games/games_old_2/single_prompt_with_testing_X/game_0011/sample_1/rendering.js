// rendering.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, NUM_LANES, LANE_WIDTH } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MOB CONTROL", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(150, 180, 255);
  p.textSize(18);
  p.text("Strategic Unit Warfare", CANVAS_WIDTH / 2, 100);
  
  // Instructions box
  p.fill(40, 45, 60);
  p.stroke(100, 120, 180);
  p.strokeWeight(2);
  p.rect(50, 130, CANVAS_WIDTH - 100, 200, 10);
  
  // Instructions
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "Destroy the enemy base (500 HP) before they destroy yours!",
    "",
    "STRATEGY:",
    "• Fire units through multiplier gates (x2, x3, +50)",
    "• Deploy Champions (Z) to break enemy lines",
    "• Use Speed Boost (Shift) for rapid assaults",
    "",
    "CONTROLS:",
    "Arrow Left/Right - Aim cannon",
    "Space - Fire units (hold)",
    "Z - Deploy Champion (costs 100 units)",
    "Shift - Speed Boost (costs 50 units)"
  ];
  
  let yPos = 145;
  for (let line of instructions) {
    if (line.startsWith("OBJECTIVE:") || line.startsWith("STRATEGY:") || line.startsWith("CONTROLS:")) {
      p.fill(255, 215, 0);
    } else if (line.startsWith("•")) {
      p.fill(150, 200, 255);
    } else {
      p.fill(200, 200, 200);
    }
    p.text(line, 70, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const blink = Math.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function drawGameplayScreen(p) {
  p.background(25, 30, 45);
  
  // Draw lanes
  drawLanes(p);
  
  // Draw bases
  drawBases(p);
  
  // Draw gates
  for (let gate of gameState.gates) {
    gate.draw(p, p.frameCount);
  }
  
  // Draw entities
  for (let entity of gameState.entities) {
    entity.draw(p);
  }
  
  // Draw player cannon
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw pause indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawLanes(p) {
  p.stroke(60, 70, 90);
  p.strokeWeight(1);
  for (let i = 1; i < NUM_LANES; i++) {
    const x = i * LANE_WIDTH;
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
}

export function drawBases(p) {
  // Enemy base (top)
  const enemyHPPercent = Math.max(0, gameState.enemyBaseHP / 500);
  p.fill(100, 40, 40);
  p.stroke(200, 80, 80);
  p.strokeWeight(2);
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // HP bar
  p.fill(255, 100, 100);
  p.noStroke();
  p.rect(10, 8, (CANVAS_WIDTH - 20) * enemyHPPercent, 14);
  
  // HP text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`ENEMY BASE: ${Math.max(0, Math.floor(gameState.enemyBaseHP))} HP`, CANVAS_WIDTH / 2, 15);
  
  // Player base (bottom)
  const playerHPPercent = Math.max(0, gameState.playerBaseHP / 500);
  p.fill(40, 60, 100);
  p.stroke(80, 120, 200);
  p.strokeWeight(2);
  p.rect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
  
  // HP bar
  p.fill(100, 150, 255);
  p.noStroke();
  p.rect(10, CANVAS_HEIGHT - 22, (CANVAS_WIDTH - 20) * playerHPPercent, 14);
  
  // HP text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`YOUR BASE: ${Math.max(0, Math.floor(gameState.playerBaseHP))} HP`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
}

export function drawUI(p) {
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 40);
  p.text(`Units: ${gameState.unitCount}`, 10, 60);
  p.text(`Level: ${gameState.level}`, 10, 80);
  
  // Ability indicators
  const championReady = gameState.unitCount >= 100;
  const speedBoostReady = gameState.unitCount >= 50;
  
  // Champion indicator
  p.fill(...(championReady ? [255, 215, 0] : [80, 80, 80]));
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`[Z] Champion ${championReady ? 'READY' : '(100 units)'}`, CANVAS_WIDTH - 10, 40);
  
  // Speed boost indicator
  p.fill(...(speedBoostReady ? [100, 255, 255] : [80, 80, 80]));
  p.text(`[Shift] Speed Boost ${speedBoostReady ? 'READY' : '(50 units)'}`, CANVAS_WIDTH - 10, 60);
  
  // Speed boost active indicator
  if (gameState.speedBoostActive) {
    p.fill(100, 255, 255);
    const remaining = Math.ceil(gameState.speedBoostFrames / 60);
    p.text(`SPEED BOOST: ${remaining}s`, CANVAS_WIDTH - 10, 80);
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 25, 35);
  
  const won = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(...(won ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 80);
  
  // Stats box
  p.fill(40, 45, 60);
  p.stroke(100, 120, 180);
  p.strokeWeight(2);
  p.rect(100, 140, CANVAS_WIDTH - 200, 160, 10);
  
  // Stats
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  
  p.text("Final Score:", 120, 160);
  p.fill(255, 215, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(gameState.score, CANVAS_WIDTH - 120, 160);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Total Units Spawned:", 120, 190);
  p.fill(150, 200, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(gameState.totalUnitsSpawned, CANVAS_WIDTH - 120, 190);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Your Base HP:", 120, 220);
  p.fill(...(gameState.playerBaseHP > 0 ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.RIGHT, p.TOP);
  p.text(Math.max(0, Math.floor(gameState.playerBaseHP)), CANVAS_WIDTH - 120, 220);
  
  if (won) {
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Championship Stars:", 120, 250);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`+3 (Total: ${gameState.championStars})`, CANVAS_WIDTH - 120, 250);
  }
  
  // Restart prompt
  p.fill(150, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}