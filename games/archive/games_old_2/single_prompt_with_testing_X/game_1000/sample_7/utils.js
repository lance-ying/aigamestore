// utils.js - Utility functions

import { gameState, TILE_SIZE, GRID_COLS, GRID_ROWS, CROP_TYPES, SEASONS } from './globals.js';
import { FarmTile } from './entities.js';

export function initializeFarmGrid() {
  gameState.farmGrid = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    gameState.farmGrid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.farmGrid[row][col] = new FarmTile(col, row);
    }
  }
}

export function getTileAtPosition(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  
  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    return gameState.farmGrid[row][col];
  }
  return null;
}

export function advanceDay(p) {
  gameState.day++;
  gameState.framesSinceDay = 0;
  gameState.timeOfDay = 0;
  gameState.energy = gameState.maxEnergy;
  
  // Advance season
  if (gameState.day % 20 === 1 && gameState.day > 1) {
    gameState.season = (gameState.season + 1) % 3;
    
    p.logs.game_info.push({
      data: { event: "season_change", season: SEASONS[gameState.season], day: gameState.day },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Update all farm tiles
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.farmGrid[row][col].advanceDay();
    }
  }
  
  p.logs.game_info.push({
    data: { event: "day_advance", day: gameState.day, energy: gameState.energy },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function addFarmingXP(amount) {
  gameState.farmingXP += amount;
  
  // Level up
  const xpNeeded = gameState.farmingLevel * 100;
  if (gameState.farmingXP >= xpNeeded) {
    gameState.farmingLevel++;
    gameState.farmingXP = 0;
    gameState.maxEnergy += 10;
    gameState.energy = gameState.maxEnergy;
  }
}

export function getAvailableCrops() {
  const season = SEASONS[gameState.season];
  const available = [];
  
  for (let key in CROP_TYPES) {
    const crop = CROP_TYPES[key];
    if (crop.season === season) {
      available.push(key);
    }
  }
  
  // Always allow wheat as fallback
  if (available.length === 0) {
    available.push("WHEAT");
  }
  
  return available;
}

export function drawBody(p, body, color) {
  p.push();
  p.translate(body.position.x, body.position.y);
  p.rotate(body.angle);
  
  if (body.circleRadius) {
    p.fill(color);
    p.noStroke();
    p.circle(0, 0, body.circleRadius * 2);
  } else {
    p.fill(color);
    p.noStroke();
    p.beginShape();
    const vertices = body.vertices;
    for (let v of vertices) {
      const vx = v.x - body.position.x;
      const vy = v.y - body.position.y;
      p.vertex(vx, vy);
    }
    p.endShape(p.CLOSE);
  }
  
  p.pop();
}