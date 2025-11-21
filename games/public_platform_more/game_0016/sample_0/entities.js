// entities.js - Game entities and logic

import { gameState } from './globals.js';
import { MAP_DATA } from './globals.js';

export class Region {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.continentId = data.continentId;
    this.x = data.x;
    this.y = data.y;
    this.adjacent = data.adjacent;
    this.troops = { 0: 0, 1: 0 };
    this.castle = null;
    this.isCity = false;
  }
  
  getController() {
    if (this.troops[0] > this.troops[1]) return 0;
    if (this.troops[1] > this.troops[0]) return 1;
    return null;
  }
  
  getTotalTroops(playerId) {
    return this.troops[playerId];
  }
  
  addTroops(playerId, count) {
    this.troops[playerId] += count;
  }
  
  removeTroops(playerId, count) {
    this.troops[playerId] = Math.max(0, this.troops[playerId] - count);
  }
}

export class Player {
  constructor(id, name, isAI) {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.troops = 10;
    this.resources = { COIN: 0, FOOD: 0, WOOD: 0 };
    this.castles = [];
    this.score = 0;
  }
  
  addResource(resource, amount) {
    this.resources[resource] += amount;
  }
  
  calculateScore() {
    let score = 0;
    
    // Resources
    score += this.resources.COIN * 1;
    score += this.resources.FOOD * 1;
    score += this.resources.WOOD * 1;
    
    // Region control
    const controlledRegions = gameState.regions.filter(r => r.getController() === this.id);
    score += controlledRegions.length * 1;
    
    // Continent control
    MAP_DATA.continents.forEach(continent => {
      const continentRegions = continent.regions.map(r => r.id);
      const controlled = continentRegions.filter(rid => {
        const region = gameState.regions[rid];
        return region.getController() === this.id;
      });
      
      if (controlled.length === continentRegions.length) {
        score += 5; // Full continent bonus
      } else if (controlled.length > continentRegions.length / 2) {
        score += 2; // Majority bonus
      }
    });
    
    // Castle bonus
    score += this.castles.length * 2;
    
    this.score = score;
    return score;
  }
}

export function getContinentForRegion(regionId) {
  for (let continent of MAP_DATA.continents) {
    if (continent.regions.some(r => r.id === regionId)) {
      return continent.id;
    }
  }
  return -1;
}

export function getRegionsInContinent(continentId) {
  const continent = MAP_DATA.continents[continentId];
  return continent ? continent.regions.map(r => r.id) : [];
}

export function areRegionsAdjacent(regionId1, regionId2) {
  const region = gameState.regions[regionId1];
  return region && region.adjacent.includes(regionId2);
}

export function canSailBetweenRegions(regionId1, regionId2) {
  const continent1 = getContinentForRegion(regionId1);
  const continent2 = getContinentForRegion(regionId2);
  return continent1 !== continent2;
}