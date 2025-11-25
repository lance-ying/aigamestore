// rendering.js - Rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, GAME_PHASES, gameState, PAL_TYPES, WORKSTATION_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAL FRONTIER", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.text("Capture mysterious Pals and build a thriving base!", CANVAS_WIDTH / 2, 140);
  p.text("Defend against poachers and manage resources wisely.", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(150, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const startX = 80;
  let y = 200;
  p.text("ARROW KEYS - Move around the world", startX, y);
  p.text("SPACE - Attack wild Pals and poachers", startX, y + 20);
  p.text("Z - Capture weakened Pals (below 30% health)", startX, y + 40);
  p.text("SHIFT - Interact with workstations (assign/unassign Pals)", startX, y + 60);
  
  // Objective
  p.fill(255, 255, 150);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("OBJECTIVE: Reach 1000 Prosperity Points!", CANVAS_WIDTH / 2, 310);
  
  // Prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(200, 200, 200);
  p.textSize(18);
  if (isWin) {
    p.text("You built a thriving Pal settlement!", CANVAS_WIDTH / 2, 180);
  } else {
    p.text("Your settlement has fallen...", CANVAS_WIDTH / 2, 180);
  }
  
  // Score
  p.fill(255, 255, 150);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  p.text(`Prosperity: ${Math.floor(gameState.resources.prosperity)}`, CANVAS_WIDTH / 2, 260);
  
  // Stats
  p.fill(180, 180, 180);
  p.textSize(14);
  p.text(`Captured Pals: ${gameState.capturedPals.filter(p => p.active).length}`, CANVAS_WIDTH / 2, 300);
  p.text(`Workstations: ${gameState.workstations.length}`, CANVAS_WIDTH / 2, 320);
  
  // Prompt
  p.fill(150, 150, 255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

export function renderWorld(p) {
  const camera = gameState.camera;
  
  // Background
  p.background(60, 80, 60);
  
  // Draw grid
  p.stroke(70, 90, 70);
  p.strokeWeight(1);
  const gridSize = 50;
  const startX = Math.floor((camera.x - CANVAS_WIDTH / 2) / gridSize) * gridSize;
  const startY = Math.floor((camera.y - CANVAS_HEIGHT / 2) / gridSize) * gridSize;
  
  for (let x = startX; x < camera.x + CANVAS_WIDTH / 2 + gridSize; x += gridSize) {
    const screenX = x - camera.x + CANVAS_WIDTH / 2;
    p.line(screenX, 0, screenX, CANVAS_HEIGHT);
  }
  for (let y = startY; y < camera.y + CANVAS_HEIGHT / 2 + gridSize; y += gridSize) {
    const screenY = y - camera.y + CANVAS_HEIGHT / 2;
    p.line(0, screenY, CANVAS_WIDTH, screenY);
  }
  
  // Draw world boundaries
  p.stroke(100, 150, 100);
  p.strokeWeight(3);
  p.noFill();
  const bounds = {
    x: 0 - camera.x + CANVAS_WIDTH / 2,
    y: 0 - camera.y + CANVAS_HEIGHT / 2,
    w: WORLD_WIDTH,
    h: WORLD_HEIGHT
  };
  p.rect(bounds.x, bounds.y, bounds.w, bounds.h);
}

export function renderEntities(p) {
  const camera = gameState.camera;
  
  // Render workstations
  for (const station of gameState.workstations) {
    if (!station.isOnScreen(camera)) continue;
    const pos = station.getScreenPos(camera);
    
    p.fill(...station.stationData.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(pos.x - station.radius, pos.y - station.radius, station.radius * 2, station.radius * 2);
    
    // Progress bar
    if (station.assignedPal) {
      p.noStroke();
      p.fill(50, 50, 50);
      p.rect(pos.x - 20, pos.y - station.radius - 10, 40, 5);
      p.fill(100, 255, 100);
      p.rect(pos.x - 20, pos.y - station.radius - 10, 40 * station.productionProgress, 5);
    }
    
    // Label
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(station.stationData.name, pos.x, pos.y);
  }
  
  // Render wild pals
  for (const pal of gameState.wildPals) {
    if (!pal.active || !pal.isOnScreen(camera)) continue;
    renderPal(p, pal, camera);
  }
  
  // Render captured pals
  for (const pal of gameState.capturedPals) {
    if (!pal.active || !pal.isOnScreen(camera)) continue;
    renderPal(p, pal, camera);
  }
  
  // Render poachers
  for (const poacher of gameState.poachers) {
    if (!poacher.active || !poacher.isOnScreen(camera)) continue;
    renderPoacher(p, poacher, camera);
  }
  
  // Render player
  if (gameState.player) {
    renderPlayer(p, gameState.player, camera);
  }
  
  // Render projectiles
  for (const proj of gameState.projectiles) {
    if (!proj.active || !proj.isOnScreen(camera)) continue;
    const pos = proj.getScreenPos(camera);
    p.fill(...(proj.source === 'player' ? [255, 255, 100] : [255, 100, 100]));
    p.noStroke();
    p.circle(pos.x, pos.y, proj.radius * 2);
  }
  
  // Render particles
  for (const particle of gameState.particles) {
    if (!particle.active || !particle.isOnScreen(camera)) continue;
    const pos = particle.getScreenPos(camera);
    p.fill(...particle.color, particle.getAlpha());
    p.noStroke();
    p.circle(pos.x, pos.y, particle.radius * 2);
  }
}

export function renderPal(p, pal, camera) {
  const pos = pal.getScreenPos(camera);
  
  // Body
  p.fill(...pal.palData.color);
  p.stroke(0);
  p.strokeWeight(2);
  p.circle(pos.x, pos.y, pal.radius * 2);
  
  // Eyes
  p.fill(255);
  p.noStroke();
  p.circle(pos.x - 4, pos.y - 3, 4);
  p.circle(pos.x + 4, pos.y - 3, 4);
  p.fill(0);
  p.circle(pos.x - 4, pos.y - 3, 2);
  p.circle(pos.x + 4, pos.y - 3, 2);
  
  // Health bar
  if (pal.health < pal.maxHealth) {
    p.noStroke();
    p.fill(50, 50, 50);
    p.rect(pos.x - 15, pos.y - pal.radius - 8, 30, 4);
    p.fill(...(pal.health / pal.maxHealth > 0.3 ? [100, 255, 100] : [255, 100, 100]));
    p.rect(pos.x - 15, pos.y - pal.radius - 8, 30 * (pal.health / pal.maxHealth), 4);
  }
  
  // Capture indicator
  if (pal.canBeCaptured() && !pal.isCaptured) {
    p.noFill();
    p.stroke(255, 255, 100);
    p.strokeWeight(2);
    p.circle(pos.x, pos.y, pal.radius * 2 + 8);
  }
  
  // Captured indicator
  if (pal.isCaptured) {
    p.fill(100, 255, 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("★", pos.x, pos.y + pal.radius + 10);
  }
}

export function renderPoacher(p, poacher, camera) {
  const pos = poacher.getScreenPos(camera);
  
  // Body
  p.fill(150, 50, 50);
  p.stroke(0);
  p.strokeWeight(2);
  p.circle(pos.x, pos.y, poacher.radius * 2);
  
  // Hat
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(pos.x - 8, pos.y - poacher.radius - 4, 16, 4);
  
  // Face
  p.fill(200, 150, 120);
  p.circle(pos.x, pos.y, poacher.radius * 1.5);
  
  // Eyes
  p.fill(255, 100, 100);
  p.circle(pos.x - 3, pos.y - 2, 3);
  p.circle(pos.x + 3, pos.y - 2, 3);
  
  // Health bar
  if (poacher.health < poacher.maxHealth) {
    p.noStroke();
    p.fill(50, 50, 50);
    p.rect(pos.x - 15, pos.y - poacher.radius - 8, 30, 4);
    p.fill(255, 100, 100);
    p.rect(pos.x - 15, pos.y - poacher.radius - 8, 30 * (poacher.health / poacher.maxHealth), 4);
  }
}

export function renderPlayer(p, player, camera) {
  const pos = player.getScreenPos(camera);
  
  // Glow if invulnerable
  if (player.invulnerable > 0 && player.invulnerable % 10 < 5) {
    p.fill(255, 255, 100, 100);
    p.noStroke();
    p.circle(pos.x, pos.y, player.radius * 3);
  }
  
  // Body
  p.fill(100, 150, 255);
  p.stroke(0);
  p.strokeWeight(2);
  p.circle(pos.x, pos.y, player.radius * 2);
  
  // Face
  p.fill(255, 200, 150);
  p.noStroke();
  p.circle(pos.x, pos.y - 2, player.radius * 1.3);
  
  // Eyes
  p.fill(0);
  p.circle(pos.x - 3, pos.y - 4, 2);
  p.circle(pos.x + 3, pos.y - 4, 2);
  
  // Health bar
  p.noStroke();
  p.fill(50, 50, 50);
  p.rect(pos.x - 20, pos.y - player.radius - 12, 40, 6);
  p.fill(...(player.health / player.maxHealth > 0.3 ? [100, 255, 100] : [255, 100, 100]));
  p.rect(pos.x - 20, pos.y - player.radius - 12, 40 * (player.health / player.maxHealth), 6);
}

export function renderUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 80);
  
  // Resources
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  let x = 10;
  let y = 10;
  
  p.fill(255, 200, 100);
  p.text(`Score: ${gameState.score}`, x, y);
  
  p.fill(255, 100, 255);
  p.text(`Prosperity: ${Math.floor(gameState.resources.prosperity)}/1000`, x, y + 20);
  
  p.fill(100, 255, 100);
  p.text(`Food: ${Math.floor(gameState.resources.food)}`, x + 180, y);
  
  p.fill(180, 180, 180);
  p.text(`Ore: ${Math.floor(gameState.resources.ore)}`, x + 270, y);
  
  p.fill(150, 200, 255);
  p.text(`Materials: ${Math.floor(gameState.resources.materials)}`, x + 340, y);
  
  // Player stats
  const player = gameState.player;
  if (player) {
    p.fill(255, 100, 100);
    p.text(`Health: ${Math.floor(player.health)}/${player.maxHealth}`, x, y + 40);
    
    p.fill(255, 200, 100);
    p.text(`Hunger: ${Math.floor(gameState.hunger)}%`, x + 150, y + 40);
  }
  
  // Captured pals count
  p.fill(100, 255, 255);
  p.text(`Captured Pals: ${gameState.capturedPals.filter(p => p.active).length}`, x + 300, y + 40);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("SPACE: Attack | Z: Capture | SHIFT: Assign/Build", x, y + 60);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  // Build menu hint
  if (gameState.resources.food >= 20 || gameState.resources.ore >= 10) {
    p.fill(255, 255, 150, Math.abs(Math.sin(gameState.frameCount * 0.05)) * 100 + 155);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text("Hold SHIFT to build workstations!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
}