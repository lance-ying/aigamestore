// map.js - Map generation and resource nodes

import { gameState } from './globals.js';
import { createCombatZone } from './enemy.js';

export function initializeMap(level) {
  gameState.mapState.resourceNodes = [];
  gameState.mapState.combatZones = [];
  
  // Create resource nodes
  const nodeCount = 15 + level * 5;
  const mapRadius = 250;
  
  for (let i = 0; i < nodeCount; i++) {
    const angle = (Math.PI * 2 * i) / nodeCount + Math.random() * 0.5;
    const distance = 100 + Math.random() * mapRadius;
    const x = 300 + Math.cos(angle) * distance;
    const y = 200 + Math.sin(angle) * distance;
    
    const types = ["ice", "wood", "food"];
    const weights = [0.4, 0.3, 0.3];
    const type = weightedRandom(types, weights);
    
    gameState.mapState.resourceNodes.push({
      type,
      x,
      y,
      available: true,
      amount: 10 + Math.floor(Math.random() * 20)
    });
  }
  
  // Create combat zones based on level
  const combatZoneCount = Math.min(level, 5);
  for (let i = 0; i < combatZoneCount; i++) {
    const angle = (Math.PI * 2 * i) / combatZoneCount;
    const distance = 150 + i * 40;
    const x = 300 + Math.cos(angle) * distance;
    const y = 200 + Math.sin(angle) * distance;
    
    const zone = createCombatZone(i, x, y, level);
    gameState.mapState.combatZones.push(zone);
  }
}

function weightedRandom(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }
  
  return items[items.length - 1];
}

export function getResourceIcon(type) {
  switch(type) {
    case "ice": return "❄";
    case "wood": return "🌲";
    case "food": return "🍖";
    default: return "?";
  }
}

export function getResourceColor(type) {
  switch(type) {
    case "ice": return [150, 200, 255];
    case "wood": return [139, 90, 43];
    case "food": return [180, 100, 80];
    default: return [150, 150, 150];
  }
}