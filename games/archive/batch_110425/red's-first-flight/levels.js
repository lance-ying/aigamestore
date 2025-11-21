// levels.js - Level configurations

import { BLOCK_WIDTH, BLOCK_HEIGHT } from './globals.js';

export const levels = [
  {
    level: 1,
    birds: 3,
    structures: [
      // Simple tower
      { type: 'block', x: 400, y: 340, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, material: 'wood' },
      { type: 'block', x: 400, y: 260, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, material: 'wood' },
      { type: 'block', x: 400, y: 180, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, material: 'wood' },
      { type: 'pig', x: 400, y: 120 }
    ]
  },
  {
    level: 2,
    birds: 4,
    structures: [
      // Two towers with bridge
      { type: 'block', x: 350, y: 340, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, material: 'wood' },
      { type: 'block', x: 350, y: 260, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, material: 'wood' },
      { type: 'block', x: 450, y: 340, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, material: 'wood' },
      { type: 'block', x: 450, y: 260, width: BLOCK_WIDTH, height: BLOCK_HEIGHT, material: 'wood' },
      { type: 'block', x: 400, y: 200, width: BLOCK_HEIGHT, height: BLOCK_WIDTH, material: 'wood', rotation: Math.PI / 2 },
      { type: 'pig', x: 350, y: 200 },
      { type: 'pig', x: 450, y: 200 }
    ]
  }
];

export function getCurrentLevel(levelNumber) {
  if (levelNumber > levels.length) {
    // Generate a more complex level
    return generateLevel(levelNumber);
  }
  return levels[levelNumber - 1];
}

function generateLevel(levelNumber) {
  const birds = Math.min(3 + Math.floor(levelNumber / 2), 6);
  const structures = [];
  
  // Add base blocks
  for (let i = 0; i < 2; i++) {
    const x = 380 + i * 60;
    structures.push({
      type: 'block',
      x: x,
      y: 340,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      material: 'wood'
    });
    structures.push({
      type: 'block',
      x: x,
      y: 260,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      material: 'wood'
    });
  }
  
  // Add pigs
  const pigCount = Math.min(2 + Math.floor(levelNumber / 3), 4);
  for (let i = 0; i < pigCount; i++) {
    structures.push({
      type: 'pig',
      x: 360 + i * 40,
      y: 200
    });
  }
  
  return { level: levelNumber, birds, structures };
}