// ui.js - User interface rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, PHASES, TURN_PHASES, gameState, WEAPON_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 40, 60);
  
  // Title
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("WORMS BATTLE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text("Turn-Based Artillery Combat", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 60, 80, 200);
  p.rect(50, 150, CANVAS_WIDTH - 100, 180, 10);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE: Eliminate all enemy worms!",
    "",
    "MOVEMENT PHASE:",
    "  Arrow Keys: Move worm left/right",
    "  Space: Jump",
    "",
    "ATTACK PHASE:",
    "  Shift: Cycle weapons",
    "  Arrow Keys: Adjust aim angle/power",
    "  Z: Fire weapon",
    "",
    "Each worm has 100 HP. Use terrain and weapons strategically!"
  ];
  
  let yPos = 160;
  for (const line of instructions) {
    p.text(line, 70, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}

export function renderGameOverScreen(p, won) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result box
  p.fill(40, 60, 80, 230);
  p.rect(100, 100, CANVAS_WIDTH - 200, 200, 10);
  
  // Title
  p.fill(...(won ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(won ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 140);
  
  // Stats
  p.fill(255);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
  
  if (won) {
    p.fill(255, 220, 100);
    p.text(`Coins Earned: ${gameState.winCoins}`, CANVAS_WIDTH / 2, 220);
    p.text(`XP Earned: ${gameState.winXP}`, CANVAS_WIDTH / 2, 240);
  }
  
  // Restart prompt
  p.fill(200, 200, 200);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 270);
  
  p.pop();
}

export function renderGameUI(p) {
  p.push();
  
  // Top bar background
  p.fill(20, 30, 40, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 15);
  
  // Current team indicator
  const currentTeam = gameState.currentTeam === 0 ? "YOUR TEAM" : "ENEMY TEAM";
  const teamColor = gameState.currentTeam === 0 ? [100, 255, 100] : [255, 100, 100];
  p.fill(...teamColor);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(currentTeam, CANVAS_WIDTH / 2, 15);
  
  // Turn phase
  let phaseText = "";
  switch (gameState.turnPhase) {
    case TURN_PHASES.MOVEMENT:
      phaseText = "MOVEMENT";
      break;
    case TURN_PHASES.ATTACK:
      phaseText = "ATTACK";
      break;
    case TURN_PHASES.FIRING:
      phaseText = "FIRING";
      break;
    case TURN_PHASES.SWITCHING:
      phaseText = "SWITCHING";
      break;
  }
  
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.text(phaseText, CANVAS_WIDTH - 10, 15);
  
  // Movement meter during movement phase
  if (gameState.turnPhase === TURN_PHASES.MOVEMENT) {
    const meterWidth = 100;
    const meterHeight = 8;
    const meterX = 10;
    const meterY = 32;
    
    p.fill(50);
    p.rect(meterX, meterY, meterWidth, meterHeight);
    
    const progress = 1 - (gameState.currentMovement / gameState.movementLimit);
    p.fill(100, 200, 255);
    p.rect(meterX, meterY, meterWidth * progress, meterHeight);
    
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(10);
    p.text("MOVE", meterX + meterWidth + 5, meterY + meterHeight / 2);
  }
  
  // Weapon info during attack phase
  if (gameState.turnPhase === TURN_PHASES.ATTACK) {
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(`Weapon: ${gameState.selectedWeapon}`, 10, 35);
    
    // Aim indicator
    const aimText = `Angle: ${Math.round(gameState.aimAngle)}° Power: ${Math.round(gameState.aimPower)}%`;
    p.text(aimText, CANVAS_WIDTH / 2 - 80, 35);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  // Team worm counts
  const alivePlayerWorms = gameState.playerWorms.filter(w => !w.isDead).length;
  const aliveEnemyWorms = gameState.enemyWorms.filter(w => !w.isDead).length;
  
  p.fill(100, 200, 100);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(12);
  p.text(`Your Team: ${alivePlayerWorms}/3`, 10, CANVAS_HEIGHT - 5);
  
  p.fill(200, 100, 100);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.text(`Enemy Team: ${aliveEnemyWorms}/3`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 5);
  
  p.pop();
}

export function renderAimingLine(p, worm) {
  if (gameState.turnPhase !== TURN_PHASES.ATTACK || !worm.isActive) return;
  
  p.push();
  
  const angleRad = (gameState.aimAngle * Math.PI) / 180;
  const powerScale = gameState.aimPower / 100;
  const lineLength = 40 + powerScale * 60;
  
  const endX = worm.x + Math.cos(angleRad) * lineLength;
  const endY = worm.y + Math.sin(angleRad) * lineLength;
  
  // Aiming line
  p.stroke(255, 255, 100);
  p.strokeWeight(2);
  p.line(worm.x, worm.y, endX, endY);
  
  // Arrow head
  p.fill(255, 255, 100);
  p.noStroke();
  p.push();
  p.translate(endX, endY);
  p.rotate(angleRad);
  p.triangle(0, 0, -8, -4, -8, 4);
  p.pop();
  
  // Power arc
  p.noFill();
  p.stroke(255, 255, 100, 100);
  p.strokeWeight(1);
  const arcRadius = 30;
  p.arc(worm.x, worm.y, arcRadius * 2, arcRadius * 2, angleRad - 0.2, angleRad + 0.2);
  
  p.pop();
}