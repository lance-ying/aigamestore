// levelgen.js - Level generation

import { ConsumableObject, OBJECT_TYPES } from './consumable.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generateLevel(p, levelNumber) {
  const objects = [];
  
  const configs = {
    1: {
      cars: 40,
      smallBuildings: 20,
      mediumBuildings: 5,
      largeBuildings: 0
    },
    2: {
      cars: 30,
      smallBuildings: 25,
      mediumBuildings: 15,
      largeBuildings: 3
    },
    3: {
      cars: 20,
      smallBuildings: 20,
      mediumBuildings: 25,
      largeBuildings: 10
    }
  };
  
  const config = configs[levelNumber] || configs[1];
  
  // Generate cars
  for (let i = 0; i < config.cars; i++) {
    const type = OBJECT_TYPES.CAR;
    const size = p.random(type.minSize, type.maxSize);
    const x = p.random(size * 2, CANVAS_WIDTH - size * 2);
    const y = p.random(size * 2, CANVAS_HEIGHT - size * 2);
    const colorIndex = p.floor(p.random(type.colors.length));
    objects.push(new ConsumableObject(x, y, 'CAR', size, colorIndex));
  }
  
  // Generate small buildings
  for (let i = 0; i < config.smallBuildings; i++) {
    const type = OBJECT_TYPES.SMALL_BUILDING;
    const size = p.random(type.minSize, type.maxSize);
    const x = p.random(size * 2, CANVAS_WIDTH - size * 2);
    const y = p.random(size * 2, CANVAS_HEIGHT - size * 2);
    const colorIndex = p.floor(p.random(type.colors.length));
    objects.push(new ConsumableObject(x, y, 'SMALL_BUILDING', size, colorIndex));
  }
  
  // Generate medium buildings
  for (let i = 0; i < config.mediumBuildings; i++) {
    const type = OBJECT_TYPES.MEDIUM_BUILDING;
    const size = p.random(type.minSize, type.maxSize);
    const x = p.random(size * 2, CANVAS_WIDTH - size * 2);
    const y = p.random(size * 2, CANVAS_HEIGHT - size * 2);
    const colorIndex = p.floor(p.random(type.colors.length));
    objects.push(new ConsumableObject(x, y, 'MEDIUM_BUILDING', size, colorIndex));
  }
  
  // Generate large buildings
  for (let i = 0; i < config.largeBuildings; i++) {
    const type = OBJECT_TYPES.LARGE_BUILDING;
    const size = p.random(type.minSize, type.maxSize);
    const x = p.random(size * 2, CANVAS_WIDTH - size * 2);
    const y = p.random(size * 2, CANVAS_HEIGHT - size * 2);
    const colorIndex = p.floor(p.random(type.colors.length));
    objects.push(new ConsumableObject(x, y, 'LARGE_BUILDING', size, colorIndex));
  }
  
  return objects;
}

export function getLevelAICount(levelNumber) {
  return Math.min(2 + levelNumber - 1, 4);
}

export function getLevelAIStartRadius(levelNumber) {
  return 10 + (levelNumber - 1) * 3;
}

export function getPlayerStartRadius(levelNumber) {
  return 15 + (levelNumber - 1) * 5;
}