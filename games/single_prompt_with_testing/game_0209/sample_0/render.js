// render.js - Main rendering functions

import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getTile } from './utils.js';
import { renderHUD, renderStartScreen, renderPausedOverlay, renderGameOver } from './ui.js';

export function renderGame(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const t = y / CANVAS_HEIGHT;
    const r = 20 + t * 10;
    const g = 15 + t * 10;
    const b = 30 + t * 20;
    p.stroke(r, g, b);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render tiles
  renderTiles(p);
  
  // Render exit door
  if (gameState.exitDoor) {
    gameState.exitDoor.render(p);
  }
  
  // Render ropes
  for (const rope of gameState.ropes) {
    rope.render(p);
  }
  
  // Render gems
  for (const gem of gameState.gems) {
    if (!gem.collected) {
      gem.render(p);
    }
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  // Render bombs
  for (const bomb of gameState.bombs) {
    bomb.render(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render explosions
  for (const explosion of gameState.explosions) {
    explosion.render(p);
  }
  
  // Render particles
  for (const particle of gameState.particles) {
    particle.render(p);
  }
  
  // Render HUD
  renderHUD(p);
}

function renderTiles(p) {
  for (let y = 0; y < gameState.levelHeight; y++) {
    for (let x = 0; x < gameState.levelWidth; x++) {
      const tile = getTile(x, y);
      if (tile === 0) continue; // Empty
      
      const worldX = x * TILE_SIZE;
      const worldY = y * TILE_SIZE;
      
      p.push();
      
      switch (tile) {
        case 1: // Solid
          p.fill(80, 70, 60);
          p.stroke(60, 50, 40);
          p.strokeWeight(1);
          p.rect(worldX, worldY, TILE_SIZE, TILE_SIZE);
          // Add some texture
          p.noStroke();
          p.fill(90, 80, 70, 100);
          p.circle(worldX + 5, worldY + 5, 3);
          p.circle(worldX + 15, worldY + 12, 2);
          break;
          
        case 2: // Destructible
          p.fill(120, 100, 70);
          p.stroke(90, 70, 50);
          p.strokeWeight(1);
          p.rect(worldX, worldY, TILE_SIZE, TILE_SIZE);
          // Cracked appearance
          p.stroke(80, 60, 40);
          p.line(worldX + 5, worldY, worldX + 5, worldY + TILE_SIZE);
          p.line(worldX + 15, worldY, worldX + 15, worldY + TILE_SIZE);
          break;
          
        case 3: // Ladder
          p.stroke(140, 100, 60);
          p.strokeWeight(3);
          p.line(worldX + 5, worldY, worldX + 5, worldY + TILE_SIZE);
          p.line(worldX + 15, worldY, worldX + 15, worldY + TILE_SIZE);
          p.strokeWeight(2);
          p.line(worldX + 5, worldY + 5, worldX + 15, worldY + 5);
          p.line(worldX + 5, worldY + 12, worldX + 15, worldY + 12);
          p.line(worldX + 5, worldY + 19, worldX + 15, worldY + 19);
          break;
          
        case 4: // Platform (one-way)
          p.fill(100, 80, 60);
          p.noStroke();
          p.rect(worldX, worldY, TILE_SIZE, 4);
          break;
      }
      
      p.pop();
    }
  }
}