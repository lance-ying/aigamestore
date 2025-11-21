// territory.js - Territory and hex grid management

import { TERRAIN_TYPES } from './globals.js';

export class Territory {
  constructor(q, r, terrain) {
    this.q = q; // Axial coordinate
    this.r = r;
    this.terrain = terrain;
    this.owner = null; // Player index or null
    this.tokens = 0;
    this.isDeclined = false;
    this.bonusPoints = 0;
    
    // Screen position (calculated later)
    this.x = 0;
    this.y = 0;
  }
  
  // Convert axial to screen coordinates
  calculateScreenPosition(hexSize, offsetX, offsetY) {
    const x = hexSize * (Math.sqrt(3) * this.q + Math.sqrt(3)/2 * this.r);
    const y = hexSize * (3/2 * this.r);
    this.x = x + offsetX;
    this.y = y + offsetY;
  }
  
  // Get neighbors in axial coordinates
  getNeighbors() {
    const directions = [
      [+1, 0], [+1, -1], [0, -1],
      [-1, 0], [-1, +1], [0, +1]
    ];
    return directions.map(([dq, dr]) => ({
      q: this.q + dq,
      r: this.r + dr
    }));
  }
  
  // Calculate conquest cost
  getConquestCost() {
    if (this.owner === null) {
      return 2 + this.terrain.defenseCost;
    }
    return 2 + this.tokens + this.terrain.defenseCost;
  }
  
  // Check if point is inside hexagon
  containsPoint(px, py, hexSize) {
    const dx = Math.abs(px - this.x);
    const dy = Math.abs(py - this.y);
    
    // Simple bounding box first
    if (dx > hexSize || dy > hexSize) return false;
    
    // More precise hexagon check
    const h = hexSize * Math.sqrt(3) / 2;
    return dy <= h && dx * Math.sqrt(3) + dy * 2 <= 2 * h;
  }
}

export function createHexGrid(gridRadius) {
  const territories = [];
  const terrainTypes = Object.values(TERRAIN_TYPES);
  
  let idx = 0;
  for (let q = -gridRadius; q <= gridRadius; q++) {
    const r1 = Math.max(-gridRadius, -q - gridRadius);
    const r2 = Math.min(gridRadius, -q + gridRadius);
    
    for (let r = r1; r <= r2; r++) {
      // Pseudo-random terrain based on position
      const hash = (q * 7 + r * 13 + 42) % 100;
      let terrain;
      
      if (hash < 5) terrain = TERRAIN_TYPES.WATER;
      else if (hash < 20) terrain = TERRAIN_TYPES.MOUNTAIN;
      else if (hash < 40) terrain = TERRAIN_TYPES.FOREST;
      else if (hash < 55) terrain = TERRAIN_TYPES.SWAMP;
      else terrain = TERRAIN_TYPES.PLAINS;
      
      const territory = new Territory(q, r, terrain);
      
      // Add bonus points to some territories
      if (hash % 7 === 0 && terrain !== TERRAIN_TYPES.WATER) {
        territory.bonusPoints = Math.floor(hash / 20) + 1;
      }
      
      territories.push(territory);
      idx++;
    }
  }
  
  return territories;
}

export function findTerritory(territories, q, r) {
  return territories.find(t => t.q === q && t.r === r);
}

export function getAdjacentTerritories(territories, territory) {
  const neighbors = territory.getNeighbors();
  return neighbors
    .map(({q, r}) => findTerritory(territories, q, r))
    .filter(t => t !== undefined);
}

export function isAdjacent(territory1, territory2) {
  const dq = Math.abs(territory1.q - territory2.q);
  const dr = Math.abs(territory1.r - territory2.r);
  const ds = Math.abs((territory1.q + territory1.r) - (territory2.q + territory2.r));
  return dq <= 1 && dr <= 1 && ds <= 1 && (dq + dr + ds === 2);
}