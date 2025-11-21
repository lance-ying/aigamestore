// levels.js - Level generation and management

import { gameState } from './globals.js';

export function generateLevel(levelNumber) {
  const level = {
    number: levelNumber,
    clicksAllowed: 5,
    shapes: []
  };
  
  // Adjust difficulty based on level
  const difficulty = Math.floor((levelNumber - 1) / 10);
  level.clicksAllowed = Math.max(3, 5 - difficulty);
  
  // Generate shapes based on level
  const seed = levelNumber * 42; // Deterministic levels
  const rand = seededRandom(seed);
  
  // Base configuration
  const numRed = 3 + Math.floor(rand() * 3);
  const numGreen = 2 + Math.floor(rand() * 2);
  const numGray = rand() < 0.3 ? 1 + Math.floor(rand() * 2) : 0;
  
  // Create a stable base configuration
  const baseY = 240;
  const spacing = 60;
  
  // Add gray base shapes (if any)
  for (let i = 0; i < numGray; i++) {
    level.shapes.push({
      x: 200 + i * spacing,
      y: baseY,
      type: 'gray',
      shapeType: 'rectangle',
      size: 20 + rand() * 10
    });
  }
  
  // Add green shapes (must stay)
  for (let i = 0; i < numGreen; i++) {
    const shapeTypes = ['circle', 'rectangle', 'triangle'];
    level.shapes.push({
      x: 150 + i * spacing + rand() * 40 - 20,
      y: baseY - 50 - rand() * 30,
      type: 'green',
      shapeType: shapeTypes[Math.floor(rand() * shapeTypes.length)],
      size: 15 + rand() * 10
    });
  }
  
  // Add red shapes (must remove)
  for (let i = 0; i < numRed; i++) {
    const shapeTypes = ['circle', 'rectangle', 'triangle'];
    level.shapes.push({
      x: 180 + i * spacing + rand() * 30 - 15,
      y: baseY - 100 - rand() * 50,
      type: 'red',
      shapeType: shapeTypes[Math.floor(rand() * shapeTypes.length)],
      size: 15 + rand() * 10
    });
  }
  
  return level;
}

// Seeded random function for deterministic levels
function seededRandom(seed) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}