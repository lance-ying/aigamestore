import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';

export function drawUI(p) {
  p.push();
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawPlayingUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingUI(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
  
  p.pop();
}

function drawStartScreen(p) {
  // Background
  p.background(10, 15, 30);
  
  // Grid effect
  p.stroke(30, 40, 60, 100);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 40) {
    p.line(i, 0, i, CANVAS_HEIGHT);
  }
  for (let j = 0; j < CANVAS_HEIGHT; j += 40) {
    p.line(0, j, CANVAS_WIDTH, j);
  }
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("ROCKMAN X", CANVAS_WIDTH / 2, 60);
  
  p.fill(150, 180, 255);
  p.textSize(20);
  p.text("DEEP LOG PROTOCOL", CANVAS_WIDTH / 2, 95);
  
  // Instructions box
  p.fill(20, 30, 50, 200);
  p.rect(50, 130, CANVAS_WIDTH - 100, 190, 10);
  
  p.fill(200, 220, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  const instructions = [
    "MISSION: Navigate through 3 corrupted stages",
    "and defeat each boss to restore data integrity.",
    "",
    "CONTROLS:",
    "← → : Move   |   SPACE: Jump (double jump available)",
    "Z: Fire weapon (hold to charge!)   |   SHIFT: Dash",
    "↑ ↓ : Aim weapon   |   ESC: Pause",
    "",
    "Collect energy and health pickups to survive!"
  ];
  
  let yPos = 145;
  for (let line of instructions) {
    p.text(line, 70, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * flash, 255 * flash, 100 * flash);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

function drawPlayingUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Health bar
  p.fill(40, 40, 50, 200);
  p.rect(10, 10, 154, 24, 3);
  
  p.fill(200, 50, 50);
  p.rect(12, 12, 150 * (player.health / player.maxHealth), 20, 2);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text("HP", 20, 22);
  
  // Energy bar
  p.fill(40, 40, 50, 200);
  p.rect(10, 40, 154, 18, 3);
  
  p.fill(100, 200, 255);
  p.rect(12, 42, 150 * (player.energy / player.maxEnergy), 14, 2);
  
  p.fill(255);
  p.textSize(10);
  p.text("ENERGY", 20, 49);
  
  // Charge meter (when charging)
  if (player.isCharging) {
    p.fill(40, 40, 50, 200);
    p.rect(10, 65, 154, 18, 3);
    
    const chargePercent = player.chargeTime / player.maxChargeTime;
    const chargeLevel = player.getChargeLevel();
    
    // Color based on charge level
    if (chargeLevel >= 3) {
      p.fill(200, 240, 255);
    } else if (chargeLevel >= 2) {
      p.fill(150, 220, 255);
    } else if (chargeLevel >= 1) {
      p.fill(120, 200, 255);
    } else {
      p.fill(100, 180, 255);
    }
    
    p.rect(12, 67, 150 * chargePercent, 14, 2);
    
    p.fill(255);
    p.textSize(10);
    p.text("CHARGE", 20, 74);
    
    // Charge level indicators
    if (chargeLevel > 0) {
      p.fill(255);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(`LV${chargeLevel}`, 155, 74);
    }
  }
  
  // Score
  p.fill(40, 40, 50, 200);
  p.rect(CANVAS_WIDTH - 164, 10, 154, 24, 3);
  
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 22);
  
  // Stage info
  p.fill(40, 40, 50, 200);
  p.rect(CANVAS_WIDTH - 164, 40, 154, 18, 3);
  
  p.fill(150, 200, 255);
  p.textSize(12);
  p.text(`STAGE ${gameState.stage} / 3`, CANVAS_WIDTH - 20, 49);
}

function drawPausedOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 70);
}

function drawGameOverScreen(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("MISSION COMPLETE", CANVAS_WIDTH / 2, 100);
    
    p.fill(150, 255, 150);
    p.textSize(20);
    p.text("All stages cleared!", CANVAS_WIDTH / 2, 150);
    p.text("Data integrity fully restored!", CANVAS_WIDTH / 2, 175);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("MISSION FAILED", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 150, 150);
    p.textSize(20);
    p.text("System corrupted...", CANVAS_WIDTH / 2, 170);
  }
  
  p.fill(200, 220, 255);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  p.fill(255, 220, 100);
  p.textSize(16);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 270);
  p.text(`Completed: Stage ${gameState.stage} / 3`, CANVAS_WIDTH / 2, 295);
  
  p.fill(150, 200, 255);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(150 * flash, 200 * flash, 255 * flash);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}