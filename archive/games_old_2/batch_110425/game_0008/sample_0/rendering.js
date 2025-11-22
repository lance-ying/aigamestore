// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, UNIT_STATS } from './globals.js';
import { drawHeroAbilityIndicator } from './heroAbilities.js';

export function renderGame(p) {
  // Single background call at the top
  p.background(30, 40, 50);

  if (gameState.gamePhase === PHASE_START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    drawPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    drawPlayingScreen(p);
    drawPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("IRON MARINES", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text("Tactical RTS Combat", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 50, 60);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rect(50, 150, CANVAS_WIDTH - 100, 180);
  
  // Instructions
  p.fill(255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "• Defend against 5 enemy waves",
    "• Capture 3 strategic points",
    "",
    "CONTROLS:",
    "Arrow Keys - Scroll map",
    "Space - Deploy unit at cursor",
    "Shift - Cycle unit types",
    "Z - Hero ability (orbital strike)"
  ];
  
  let yPos = 160;
  for (const line of instructions) {
    p.text(line, 70, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}

function drawPlayingScreen(p) {
  drawMap(p);
  drawEntities(p);
  drawUI(p);
  drawCursor(p);
}

function drawMap(p) {
  const cameraX = gameState.cameraX;
  const cameraY = gameState.cameraY;
  
  // Background terrain
  p.push();
  p.noStroke();
  
  // Grid pattern
  for (let x = 0; x < MAP_WIDTH; x += 40) {
    for (let y = 0; y < MAP_HEIGHT; y += 40) {
      const screenX = x - cameraX;
      const screenY = y - cameraY;
      
      if (screenX > -40 && screenX < CANVAS_WIDTH && screenY > -40 && screenY < CANVAS_HEIGHT) {
        p.fill(40, 50, 60);
        p.rect(screenX, screenY, 38, 38);
      }
    }
  }
  
  // Spawn zones indicator
  p.fill(100, 50, 50, 30);
  p.rect(MAP_WIDTH - 100 - cameraX, -cameraY, 100, MAP_HEIGHT);
  
  // Base zone
  p.fill(50, 100, 50, 30);
  p.rect(-cameraX, -cameraY, 100, MAP_HEIGHT);
  
  p.pop();
  
  // Draw capture points
  for (const point of gameState.capturePoints) {
    point.draw(p, cameraX, cameraY);
  }
}

function drawEntities(p) {
  const cameraX = gameState.cameraX;
  const cameraY = gameState.cameraY;
  
  // Draw particles
  for (const particle of gameState.particles) {
    particle.draw(p, cameraX, cameraY);
  }
  
  // Draw turrets
  for (const turret of gameState.turrets) {
    turret.draw(p, cameraX, cameraY);
  }
  
  // Draw units
  for (const unit of gameState.units) {
    unit.draw(p, cameraX, cameraY);
  }
  
  // Draw enemies
  for (const enemy of gameState.enemies) {
    enemy.draw(p, cameraX, cameraY);
  }
  
  // Draw projectiles
  for (const projectile of gameState.projectiles) {
    projectile.draw(p, cameraX, cameraY);
  }
}

function drawUI(p) {
  p.push();
  
  // UI background panel
  p.fill(20, 30, 40, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Energy
  p.fill(100, 200, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Energy: ${Math.floor(gameState.energy)}/${300}`, 10, 18);
  
  // Score
  p.fill(255, 215, 0);
  p.text(`Score: ${gameState.score}`, 180, 18);
  
  // Wave info
  p.fill(255, 150, 150);
  p.text(`Wave: ${gameState.wave}/${gameState.totalWaves}`, 320, 18);
  
  // Selected unit type
  const unitColor = UNIT_STATS[gameState.selectedUnitType].color;
  p.fill(...unitColor);
  p.text(`Unit: ${gameState.selectedUnitType}`, 450, 18);
  
  // Hero ability status
  const abilityReady = gameState.heroAbilityCooldown === 0;
  p.fill(...(abilityReady ? [100, 255, 100] : [150, 150, 150]));
  p.textAlign(p.RIGHT, p.CENTER);
  if (abilityReady) {
    p.text("Z: ABILITY READY", CANVAS_WIDTH - 10, 18);
  } else {
    const cooldownSec = Math.ceil(gameState.heroAbilityCooldown / 60);
    p.text(`Z: COOLDOWN ${cooldownSec}s`, CANVAS_WIDTH - 10, 18);
  }
  
  // Mission objectives
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Captured: ${gameState.missionObjectives.capturedPoints}/${gameState.missionObjectives.requiredPoints}`, 10, 45);
  p.text(`Enemies: ${gameState.enemiesKilled}`, 10, 65);
  
  // Energy bar
  const energyPercent = gameState.energy / 300;
  p.fill(50);
  p.rect(10, CANVAS_HEIGHT - 25, 200, 15);
  p.fill(100, 200, 255);
  p.rect(10, CANVAS_HEIGHT - 25, 200 * energyPercent, 15);
  
  p.pop();
  
  // Hero ability indicator
  drawHeroAbilityIndicator(p);
}

function drawCursor(p) {
  p.push();
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(2);
  p.circle(gameState.cursorX, gameState.cursorY, 20);
  p.line(gameState.cursorX - 15, gameState.cursorY, gameState.cursorX + 15, gameState.cursorY);
  p.line(gameState.cursorX, gameState.cursorY - 15, gameState.cursorX, gameState.cursorY + 15);
  p.pop();
}

function drawPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function drawGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Waves Survived: ${gameState.wave}/${gameState.totalWaves}`, CANVAS_WIDTH / 2, 210);
  p.text(`Enemies Defeated: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 240);
  p.text(`Points Captured: ${gameState.missionObjectives.capturedPoints}/${gameState.missionObjectives.requiredPoints}`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  p.fill(200, 200, 255);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
  
  p.pop();
}