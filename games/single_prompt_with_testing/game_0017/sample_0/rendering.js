// rendering.js - Rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, ELEMENT_TYPES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 4; i > 0; i--) {
    p.fill(120, 80, 200, 50);
    p.textSize(48 + i * 2);
    p.text("PIXEL WIZARD", CANVAS_WIDTH / 2, 80);
  }
  
  p.fill(200, 150, 255);
  p.textSize(48);
  p.text("PIXEL WIZARD", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text("Navigate through mystical caverns where every pixel is alive", CANVAS_WIDTH / 2, 140);
  p.text("Collect spell elements and combine them to defeat enemies", CANVAS_WIDTH / 2, 160);
  p.text("Reach the deepest chamber to claim victory", CANVAS_WIDTH / 2, 180);
  
  // Controls
  p.textSize(12);
  p.fill(150, 150, 170);
  p.textAlign(p.LEFT, p.CENTER);
  const controlsX = 120;
  p.text("← → : Move", controlsX, 220);
  p.text("SPACE : Cast Spell", controlsX, 240);
  p.text("Z : Switch Spell", controlsX, 260);
  p.text("ESC : Pause", controlsX, 280);
  
  // Spell examples
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  p.fill(200, 150, 200);
  p.text("Spell Elements:", CANVAS_WIDTH / 2, 310);
  
  const spellY = 330;
  p.fill(255, 100, 0);
  p.circle(200, spellY, 12);
  p.fill(220, 220, 220);
  p.textSize(10);
  p.text("Fire", 200, spellY + 20);
  
  p.fill(100, 200, 255);
  p.circle(270, spellY, 12);
  p.fill(220, 220, 220);
  p.text("Ice", 270, spellY + 20);
  
  p.fill(255, 200, 0);
  p.circle(340, spellY, 12);
  p.fill(220, 220, 220);
  p.text("Explosion", 340, spellY + 20);
  
  p.fill(0, 150, 255);
  p.circle(410, spellY, 12);
  p.fill(220, 220, 220);
  p.text("Water", 410, spellY + 20);
  
  // Press Enter
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(255, 255, 100);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  }
}

export function drawPlayingScreen(p) {
  p.background(15, 10, 25);
  
  // Draw cellular automata
  if (gameState.cellularGrid) {
    drawCellularGrid(p);
  }
  
  // Draw terrain
  for (const terrain of gameState.terrain) {
    terrain.draw(p);
  }
  
  // Draw pickups
  for (const pickup of gameState.pickups) {
    if (pickup.alive) pickup.draw(p, p.frameCount);
  }
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw enemies
  for (const entity of gameState.entities) {
    entity.draw(p);
  }
  
  // Draw projectiles
  for (const proj of gameState.projectiles) {
    if (proj.alive) proj.draw(p);
  }
  
  // Draw particles
  for (const particle of gameState.particles) {
    particle.draw(p);
  }
  
  // UI
  drawUI(p);
}

export function drawCellularGrid(p) {
  const grid = gameState.cellularGrid;
  p.push();
  p.translate(0, -gameState.cameraY);
  
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const type = grid.get(x, y);
      if (type !== ELEMENT_TYPES.EMPTY) {
        const color = getElementColor(type);
        p.fill(...color);
        p.noStroke();
        p.rect(x, y, 1, 1);
      }
    }
  }
  
  p.pop();
}

function getElementColor(type) {
  switch (type) {
    case ELEMENT_TYPES.EARTH: return [70, 70, 80];
    case ELEMENT_TYPES.WATER: return [30, 80, 150];
    case ELEMENT_TYPES.FIRE: return [255, 100, 0];
    case ELEMENT_TYPES.ICE: return [150, 220, 255];
    case ELEMENT_TYPES.SMOKE: return [80, 80, 80];
    case ELEMENT_TYPES.STEAM: return [200, 200, 220];
    default: return [0, 0, 0];
  }
}

export function drawUI(p) {
  // Health bar
  p.push();
  p.fill(50, 50, 60);
  p.rect(10, 10, 200, 20);
  
  const healthRatio = gameState.player ? gameState.player.health / gameState.player.maxHealth : 0;
  p.fill(200, 50, 50);
  p.rect(10, 10, 200 * healthRatio, 20);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`HP: ${gameState.player ? Math.ceil(gameState.player.health) : 0}`, 15, 20);
  p.pop();
  
  // Score
  p.push();
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 20);
  p.pop();
  
  // Depth
  p.push();
  p.fill(200, 200, 255);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Depth: ${gameState.currentRoom + 1}/${gameState.totalRooms}`, CANVAS_WIDTH - 10, 40);
  p.pop();
  
  // Current spell
  if (gameState.player && gameState.spellsCollected.length > 0) {
    p.push();
    const spellX = 10;
    const spellY = 40;
    
    for (let i = 0; i < gameState.spellsCollected.length; i++) {
      const spell = gameState.spellsCollected[i];
      const isActive = i === gameState.currentSpellIndex;
      
      p.fill(isActive ? 255 : 100);
      p.rect(spellX + i * 25, spellY, 20, 20);
      
      const color = getSpellUIColor(spell);
      p.fill(...color);
      p.circle(spellX + i * 25 + 10, spellY + 10, 12);
    }
    
    p.fill(200, 200, 220);
    p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER);
    p.text("Press Z to switch", spellX, spellY + 30);
    p.pop();
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.fill(255, 255, 100);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 60);
    p.pop();
  }
}

function getSpellUIColor(spellType) {
  switch (spellType) {
    case 'FIRE': return [255, 100, 0];
    case 'ICE': return [100, 200, 255];
    case 'EXPLOSION': return [255, 200, 0];
    case 'WATER': return [0, 150, 255];
    default: return [255, 255, 255];
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(56);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(180, 255, 180);
    p.textSize(18);
    p.text("You have reached the deepest chamber!", CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textSize(56);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 180, 180);
    p.textSize(18);
    p.text("The cavern has claimed another wizard...", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
  p.text(`Depth Reached: ${gameState.currentRoom + 1}/${gameState.totalRooms}`, CANVAS_WIDTH / 2, 235);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 260);
  p.text(`Spells Collected: ${gameState.spellsCollected.length}`, CANVAS_WIDTH / 2, 285);
  
  // Restart prompt
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(255, 255, 100);
    p.textSize(16);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}