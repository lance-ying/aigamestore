// facility.js - Facility management

import { gameState, FACILITY_TYPES, SYNERGIES, GRID_SIZE } from './globals.js';

export class Facility {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.info = FACILITY_TYPES[type];
    this.level = 1;
    this.popularity = 0;
  }
  
  calculatePopularity() {
    let pop = this.info.rep * this.level;
    
    // Check for synergies with adjacent facilities
    const adjacent = getAdjacentFacilities(this.x, this.y);
    
    for (const adj of adjacent) {
      for (const synergy of SYNERGIES) {
        if (synergy.types.includes(this.type) && synergy.types.includes(adj.type)) {
          pop += synergy.bonus;
        }
      }
    }
    
    this.popularity = pop;
    return pop;
  }
}

export function getAdjacentFacilities(x, y) {
  const adjacent = [];
  const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      if (gameState.grid[ny][nx]) {
        adjacent.push(gameState.grid[ny][nx]);
      }
    }
  }
  
  return adjacent;
}

export function placeFacility(type, x, y) {
  const facilityInfo = FACILITY_TYPES[type];
  
  // Check if position is valid
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return false;
  }
  
  // Check if tile is empty
  if (gameState.grid[y][x] !== null) {
    return false;
  }
  
  // Check budget
  if (gameState.budget < facilityInfo.cost) {
    return false;
  }
  
  // Place facility
  const facility = new Facility(type, x, y);
  gameState.grid[y][x] = facility;
  gameState.entities.push(facility);
  gameState.budget -= facilityInfo.cost;
  
  // Recalculate all popularity
  updateAllPopularity();
  
  return true;
}

export function updateAllPopularity() {
  let totalRep = 0;
  for (const entity of gameState.entities) {
    if (entity instanceof Facility) {
      totalRep += entity.calculatePopularity();
    }
  }
  gameState.reputation = totalRep;
}

export function getFacilityTypesList() {
  return Object.keys(FACILITY_TYPES);
}