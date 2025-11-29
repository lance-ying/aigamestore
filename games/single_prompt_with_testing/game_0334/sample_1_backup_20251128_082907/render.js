// render.js - Rendering functions

import { gameState, COLORS, TILE_SIZE } from './globals.js';
import { worldToScreen, isOnScreen } from './utils.js';

export function renderWorld(p) {
  // Render tiles
  if (gameState.worldTiles && gameState.worldTiles.length > 0) {
    for (let y = 0; y < gameState.worldTiles.length; y++) {
      for (let x = 0; x < gameState.worldTiles[0].length; x++) {
        const tile = gameState.worldTiles[y][x];
        
        if (isOnScreen(tile.x, tile.y, 50)) {
          const screen = worldToScreen(tile.x, tile.y);
          
          if (tile.type === 'ground') {
            // Ground tile with subtle pattern
            p.fill(...COLORS.ground);
            p.noStroke();
            p.rect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);
            
            // Add some variation
            const variation = ((x + y) % 3) * 5;
            p.fill(COLORS.ground[0] + variation, COLORS.ground[1] + variation, COLORS.ground[2] + variation);
            p.rect(screen.x + 2, screen.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (tile.type === 'wall') {
            // Wall tile
            p.fill(...COLORS.wall);
            p.stroke(COLORS.wall[0] - 10, COLORS.wall[1] - 10, COLORS.wall[2] - 10);
            p.strokeWeight(2);
            p.rect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);
            
            // Inner detail
            p.noStroke();
            p.fill(COLORS.wall[0] + 10, COLORS.wall[1] + 10, COLORS.wall[2] + 10);
            p.rect(screen.x + 4, screen.y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          }
        }
      }
    }
  }
}

export function renderEntities(p) {
  // Render hazards (bottom layer)
  for (const hazard of gameState.hazards) {
    hazard.render(p);
  }
  
  // Render collectibles
  for (const collectible of gameState.collectibles) {
    collectible.render(p);
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render projectiles
  for (const projectile of gameState.projectiles) {
    projectile.render(p);
  }
  
  // Render particles (top layer)
  for (const particle of gameState.particles) {
    particle.render(p);
  }
}