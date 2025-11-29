// ui.js - User interface rendering

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WEAPONS
} from './globals.js';

export function drawUI(p) {
  if (gameState.gamePhase === PHASE_START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    drawPlayingUI(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    drawPlayingUI(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
             gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 200, 50);
  p.textSize(48);
  p.text("SHELLSHOCK LIVE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200);
  p.textSize(16);
  p.text("Turn-Based Tank Artillery", CANVAS_WIDTH / 2, 130);
  
  // Instructions box
  p.fill(40, 50, 70);
  p.rect(80, 170, CANVAS_WIDTH - 160, 160, 8);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE: Destroy all enemy tanks!",
    "",
    "← → : Adjust turret angle",
    "↑ ↓ : Adjust shot power",
    "SPACE : Fire projectile",
    "Z : Switch weapon (unlock with score)",
    "",
    "Wind affects your shots - adapt your aim!"
  ];
  
  let yPos = 180;
  for (let line of instructions) {
    p.text(line, 100, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

function drawPlayingUI(p) {
  // Score
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Current weapon
  const currentWeapon = WEAPONS[gameState.currentWeaponIndex];
  p.text(`Weapon: ${currentWeapon.name}`, 10, 30);
  
  // Available weapons indicator
  p.textSize(12);
  p.text(`Unlocked: ${gameState.unlockedWeapons.length}/${WEAPONS.length}`, 10, 50);
  
  // Wind indicator
  drawWindIndicator(p);
  
  // Angle and power display
  if (gameState.currentTurn === 'player') {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text(`Angle: ${Math.round(gameState.playerAngle)}°`, CANVAS_WIDTH - 10, 10);
    p.text(`Power: ${Math.round(gameState.playerPower)}%`, CANVAS_WIDTH - 10, 28);
    
    // Turn indicator
    p.fill(100, 255, 100);
    p.text("YOUR TURN", CANVAS_WIDTH - 10, 50);
  } else {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 100, 100);
    p.textSize(14);
    p.text("ENEMY TURN", CANVAS_WIDTH - 10, 50);
  }
  
  // Enemy count
  const aliveEnemies = gameState.enemies.filter(e => e.alive).length;
  p.textAlign(p.CENTER, p.TOP);
  p.fill(255);
  p.textSize(14);
  p.text(`Enemies: ${aliveEnemies}`, CANVAS_WIDTH / 2, 10);
}

function drawWindIndicator(p) {
  const x = CANVAS_WIDTH / 2;
  const y = CANVAS_HEIGHT - 30;
  const width = 100;
  
  p.fill(40, 50, 70);
  p.rect(x - width / 2, y - 10, width, 20, 4);
  
  // Wind arrow
  const windPos = gameState.windSpeed * gameState.windDirection * 40;
  p.fill(150, 200, 255);
  p.noStroke();
  p.triangle(
    x + windPos, y - 5,
    x + windPos, y + 5,
    x + windPos + (gameState.windDirection * 8), y
  );
  
  // Center line
  p.stroke(100);
  p.strokeWeight(1);
  p.line(x, y - 10, x, y + 10);
  
  // Label
  p.noStroke();
  p.fill(200);
  p.textSize(10);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("WIND", x, y - 15);
}

function drawPausedOverlay(p) {
  p.fill(0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function drawGameOverScreen(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 120);
  
  // Final score
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  // Stats
  p.textSize(16);
  const aliveEnemies = gameState.enemies.filter(e => e.alive).length;
  p.text(`Enemies Remaining: ${aliveEnemies}`, CANVAS_WIDTH / 2, 220);
  
  if (isWin) {
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("All enemy tanks destroyed!", CANVAS_WIDTH / 2, 260);
  } else {
    p.fill(255, 150, 150);
    p.textSize(18);
    p.text("Your tank was destroyed!", CANVAS_WIDTH / 2, 260);
  }
  
  // Restart prompt
  p.fill(200);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
}