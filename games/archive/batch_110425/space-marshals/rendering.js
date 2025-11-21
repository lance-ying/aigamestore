// rendering.js - Game rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SPACE MARSHALS", CANVAS_WIDTH / 2, 80);
  
  // Mission briefing
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("MISSION BRIEFING", CANVAS_WIDTH / 2, 140);
  
  p.textSize(14);
  p.fill(180, 180, 180);
  const briefing = [
    "Infiltrate enemy territory and eliminate all hostiles.",
    "Use cover to reduce incoming damage by 75%.",
    "Flank enemies for 50% bonus damage.",
    "Deploy grenades and mines strategically.",
    "",
    "Stay alert - enemies have vision cones and will detect you.",
    "Use stealth mode (SHIFT) to reduce detection range."
  ];
  
  for (let i = 0; i < briefing.length; i++) {
    p.text(briefing[i], CANVAS_WIDTH / 2, 170 + i * 20);
  }
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(14);
  p.text("ARROW KEYS - Move", CANVAS_WIDTH / 2, 330);
  p.text("SPACE - Fire Weapon", CANVAS_WIDTH / 2, 350);
  p.text("Z - Switch Weapon", CANVAS_WIDTH / 2, 370);
  p.text("SHIFT - Toggle Stealth", CANVAS_WIDTH / 2, 390);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  if (p.frameCount % 60 < 40) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 430);
  }
}

export function renderGame(p, worldWidth, worldHeight) {
  // Background
  p.background(40, 50, 45);
  
  // Draw grid
  drawGrid(p, worldWidth, worldHeight);
  
  // Render cover
  for (let cover of gameState.cover) {
    cover.render(p);
  }
  
  // Render utilities (mines, grenades)
  for (let utility of gameState.utilities) {
    if (utility.active) {
      utility.render(p);
    }
  }
  
  // Render bullets
  for (let bullet of gameState.bullets) {
    if (bullet.active) {
      bullet.render(p);
    }
  }
  
  // Render enemies
  for (let enemy of gameState.enemies) {
    if (enemy.health > 0) {
      enemy.render(p);
    }
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles
  for (let particle of gameState.particles) {
    if (particle.active) {
      particle.render(p);
    }
  }
  
  // UI
  renderUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawGrid(p, worldWidth, worldHeight) {
  p.stroke(50, 60, 55);
  p.strokeWeight(1);
  
  const gridSize = 50;
  for (let x = 0; x < worldWidth; x += gridSize) {
    const screenX = x - gameState.cameraX;
    if (screenX > -10 && screenX < CANVAS_WIDTH + 10) {
      p.line(screenX, 0, screenX, CANVAS_HEIGHT);
    }
  }
  
  for (let y = 0; y < worldHeight; y += gridSize) {
    const screenY = y - gameState.cameraY;
    if (screenY > -10 && screenY < CANVAS_HEIGHT + 10) {
      p.line(0, screenY, CANVAS_WIDTH, screenY);
    }
  }
}

function renderUI(p) {
  // Health bar
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(10, 10, 200, 20);
  
  const healthPercent = gameState.playerHealth / gameState.playerMaxHealth;
  p.fill(...(healthPercent > 0.5 ? [0, 200, 0] : healthPercent > 0.25 ? [255, 200, 0] : [255, 0, 0]));
  p.rect(10, 10, 200 * healthPercent, 20);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${Math.floor(gameState.playerHealth)}/${gameState.playerMaxHealth}`, 15, 13);
  
  // Weapon info
  p.fill(50, 50, 50);
  p.rect(10, 35, 150, 40);
  
  p.fill(255);
  p.textSize(12);
  const weapon = gameState.weapons[gameState.currentWeapon];
  p.text(`Weapon: ${gameState.currentWeapon.toUpperCase()}`, 15, 38);
  p.text(`Ammo: ${weapon.ammo}/${weapon.maxAmmo}`, 15, 53);
  
  // Utilities
  p.fill(50, 50, 50);
  p.rect(10, 80, 150, 40);
  
  p.fill(255);
  p.text(`Grenades: ${gameState.playerGrenades}`, 15, 83);
  p.text(`Mines: ${gameState.playerMines}`, 15, 98);
  
  // Score and enemies
  p.fill(50, 50, 50);
  p.rect(CANVAS_WIDTH - 160, 10, 150, 60);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 155, 13);
  p.text(`Enemies: ${gameState.enemiesKilled}/${gameState.totalEnemies}`, CANVAS_WIDTH - 155, 28);
  
  // Stealth indicator
  if (gameState.player && gameState.player.stealthMode) {
    p.fill(100, 255, 100);
    p.text("STEALTH MODE", CANVAS_WIDTH - 155, 48);
  }
  
  // Cover indicator
  if (gameState.player && gameState.player.inCover) {
    p.fill(100, 200, 255);
    p.text("IN COVER", CANVAS_WIDTH - 155, 63);
  }
}

export function renderGameOver(p) {
  p.background(20, 20, 20);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MISSION COMPLETE" : "MISSION FAILED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Enemies Eliminated: ${gameState.enemiesKilled}/${gameState.totalEnemies}`, CANVAS_WIDTH / 2, 210);
  
  if (isWin) {
    // Calculate stars based on performance
    let stars = 1;
    if (gameState.playerHealth > 50) stars = 2;
    if (gameState.playerHealth > 75 && gameState.enemiesKilled === gameState.totalEnemies) stars = 3;
    
    p.fill(255, 200, 50);
    p.textSize(24);
    p.text(`Mission Rating: ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`, CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  if (p.frameCount % 60 < 40) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
}