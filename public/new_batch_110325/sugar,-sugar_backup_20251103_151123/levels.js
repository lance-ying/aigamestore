// levels.js - Level definitions and progression

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generateLevelData(levelNumber) {
  const level = {
    levelNumber: levelNumber,
    spawners: [],
    cups: [],
    colorFilters: [],
    gravitySwitches: [],
    teleporters: [],
    staticBarriers: []
  };
  
  // Level 1-5: Basic levels with increasing cups
  if (levelNumber === 1) {
    level.spawners.push({ x: 150, y: 50, rate: 30, color: [255, 255, 255] });
    level.cups.push({ 
      x: 450, 
      y: CANVAS_HEIGHT - 60, 
      width: 80, 
      height: 60, 
      targetAmount: 50,
      maxAmount: 55,
      currentAmount: 0,
      color: [255, 255, 255]
    });
  }
  else if (levelNumber === 2) {
    level.spawners.push({ x: CANVAS_WIDTH / 2, y: 50, rate: 30, color: [255, 255, 255] });
    level.cups.push({ 
      x: 200, 
      y: CANVAS_HEIGHT - 60, 
      width: 70, 
      height: 60, 
      targetAmount: 40,
      maxAmount: 44,
      currentAmount: 0,
      color: [255, 255, 255]
    });
    level.cups.push({ 
      x: 400, 
      y: CANVAS_HEIGHT - 60, 
      width: 70, 
      height: 60, 
      targetAmount: 40,
      maxAmount: 44,
      currentAmount: 0,
      color: [255, 255, 255]
    });
  }
  else if (levelNumber === 3) {
    level.spawners.push({ x: 150, y: 50, rate: 25, color: [255, 255, 255] });
    level.spawners.push({ x: 450, y: 50, rate: 25, color: [255, 255, 255] });
    level.cups.push({ 
      x: CANVAS_WIDTH / 2, 
      y: CANVAS_HEIGHT - 60, 
      width: 80, 
      height: 60, 
      targetAmount: 60,
      maxAmount: 66,
      currentAmount: 0,
      color: [255, 255, 255]
    });
    level.staticBarriers.push({ x1: 100, y1: 150, x2: 200, y2: 200 });
    level.staticBarriers.push({ x1: 400, y1: 200, x2: 500, y2: 150 });
  }
  else if (levelNumber === 4) {
    // Introduce color filters
    level.spawners.push({ x: CANVAS_WIDTH / 2, y: 50, rate: 28, color: [255, 255, 255] });
    level.colorFilters.push({ x: 200, y: 150, width: 60, height: 100, color: [255, 0, 0] });
    level.colorFilters.push({ x: 340, y: 150, width: 60, height: 100, color: [0, 0, 255] });
    level.cups.push({ 
      x: 150, 
      y: CANVAS_HEIGHT - 60, 
      width: 70, 
      height: 60, 
      targetAmount: 30,
      maxAmount: 33,
      currentAmount: 0,
      color: [255, 0, 0]
    });
    level.cups.push({ 
      x: 400, 
      y: CANVAS_HEIGHT - 60, 
      width: 70, 
      height: 60, 
      targetAmount: 30,
      maxAmount: 33,
      currentAmount: 0,
      color: [0, 0, 255]
    });
  }
  else if (levelNumber === 5) {
    // Introduce gravity switches
    level.spawners.push({ x: CANVAS_WIDTH / 2, y: 50, rate: 30, color: [255, 255, 255] });
    level.gravitySwitches.push({ x: 300, y: 200, radius: 40, active: false });
    level.cups.push({ 
      x: 150, 
      y: 50, 
      width: 70, 
      height: 60, 
      targetAmount: 35,
      maxAmount: 38,
      currentAmount: 0,
      color: [255, 255, 255]
    });
    level.cups.push({ 
      x: 450, 
      y: CANVAS_HEIGHT - 60, 
      width: 70, 
      height: 60, 
      targetAmount: 35,
      maxAmount: 38,
      currentAmount: 0,
      color: [255, 255, 255]
    });
  }
  else if (levelNumber === 6) {
    // Introduce teleporters
    level.spawners.push({ x: 100, y: 50, rate: 28, color: [255, 255, 255] });
    level.teleporters.push({ 
      entrance: { x: 200, y: 200, radius: 30 },
      exit: { x: 450, y: 150, radius: 30 }
    });
    level.cups.push({ 
      x: 450, 
      y: CANVAS_HEIGHT - 60, 
      width: 80, 
      height: 60, 
      targetAmount: 50,
      maxAmount: 55,
      currentAmount: 0,
      color: [255, 255, 255]
    });
  }
  else {
    // Procedural generation for levels 7-30
    const complexity = Math.min(Math.floor(levelNumber / 3), 8);
    const numSpawners = 1 + Math.floor(complexity / 3);
    const numCups = 1 + Math.floor(complexity / 2);
    
    // Create spawners
    for (let i = 0; i < numSpawners; i++) {
      level.spawners.push({
        x: 100 + (i * (CANVAS_WIDTH - 200) / Math.max(1, numSpawners - 1)),
        y: 50,
        rate: 30 - complexity,
        color: [255, 255, 255]
      });
    }
    
    // Create cups
    for (let i = 0; i < numCups; i++) {
      const cupColor = complexity > 3 ? getRandomColor(levelNumber, i) : [255, 255, 255];
      level.cups.push({
        x: 100 + (i * (CANVAS_WIDTH - 200) / Math.max(1, numCups - 1)),
        y: CANVAS_HEIGHT - 60,
        width: Math.max(60, 90 - numCups * 5),
        height: 60,
        targetAmount: 40 + complexity * 2,
        maxAmount: 44 + complexity * 2,
        currentAmount: 0,
        color: cupColor
      });
    }
    
    // Add color filters if complex enough
    if (complexity > 3) {
      const numFilters = Math.min(Math.floor(complexity / 2), 3);
      for (let i = 0; i < numFilters; i++) {
        level.colorFilters.push({
          x: 150 + i * 150,
          y: 120 + (i % 2) * 80,
          width: 50,
          height: 80,
          color: getRandomColor(levelNumber, i + 10)
        });
      }
    }
    
    // Add gravity switches if complex enough
    if (complexity > 5 && levelNumber % 4 === 1) {
      level.gravitySwitches.push({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        radius: 35,
        active: false
      });
    }
    
    // Add teleporters if complex enough
    if (complexity > 6 && levelNumber % 5 === 2) {
      level.teleporters.push({
        entrance: { x: 150, y: 180, radius: 30 },
        exit: { x: 450, y: 180, radius: 30 }
      });
    }
    
    // Add static barriers for challenge
    if (complexity > 2) {
      const numBarriers = Math.min(Math.floor(complexity / 2), 4);
      for (let i = 0; i < numBarriers; i++) {
        const y = 120 + i * 50;
        level.staticBarriers.push({
          x1: 50 + (i % 2) * 300,
          y1: y,
          x2: 150 + (i % 2) * 300,
          y2: y + 40
        });
      }
    }
  }
  
  return level;
}

function getRandomColor(seed, index) {
  const colors = [
    [255, 100, 100],  // Red
    [100, 100, 255],  // Blue
    [100, 255, 100],  // Green
    [255, 255, 100],  // Yellow
    [255, 100, 255],  // Magenta
  ];
  const colorIndex = (seed + index * 7) % colors.length;
  return colors[colorIndex];
}

export function colorsMatch(color1, color2, tolerance = 50) {
  if (!color1 || !color2) return true; // White/neutral matches everything
  if (color1[0] === 255 && color1[1] === 255 && color1[2] === 255) return true;
  if (color2[0] === 255 && color2[1] === 255 && color2[2] === 255) return true;
  
  return Math.abs(color1[0] - color2[0]) < tolerance &&
         Math.abs(color1[1] - color2[1]) < tolerance &&
         Math.abs(color1[2] - color2[2]) < tolerance;
}