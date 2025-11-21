// spawner.js
import { 
  RING_SPAWN_INTERVAL, COURSE_X_OFFSET, COURSE_WIDTH, 
  COLOR_KEYS, gameState 
} from './globals.js';
import { Ring } from './ring.js';
import { Obstacle } from './obstacle.js';

export function spawnRings(p) {
  if (gameState.frameCounter - gameState.lastRingSpawn > RING_SPAWN_INTERVAL) {
    const pattern = Math.floor(Math.random() * 4);
    const y = -50;
    
    switch (pattern) {
      case 0: // Single ring
        spawnSingleRing(p, y);
        break;
      case 1: // Line of rings
        spawnLineRings(p, y);
        break;
      case 2: // Alternating colors
        spawnAlternatingRings(p, y);
        break;
      case 3: // Mixed pattern
        spawnMixedRings(p, y);
        break;
    }
    
    gameState.lastRingSpawn = gameState.frameCounter;
  }
}

function spawnSingleRing(p, y) {
  const x = COURSE_X_OFFSET + COURSE_WIDTH / 2 + (Math.random() - 0.5) * COURSE_WIDTH * 0.6;
  const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  gameState.rings.push(new Ring(x, y, color));
}

function spawnLineRings(p, y) {
  const numRings = 3 + Math.floor(Math.random() * 3);
  const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  
  for (let i = 0; i < numRings; i++) {
    const x = COURSE_X_OFFSET + 50 + (i / (numRings - 1)) * (COURSE_WIDTH - 100);
    gameState.rings.push(new Ring(x, y - i * 30, color));
  }
}

function spawnAlternatingRings(p, y) {
  const color1 = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  let color2 = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  while (color2 === color1) {
    color2 = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  }
  
  for (let i = 0; i < 4; i++) {
    const x = COURSE_X_OFFSET + 80 + (i / 3) * (COURSE_WIDTH - 160);
    const color = i % 2 === 0 ? color1 : color2;
    gameState.rings.push(new Ring(x, y - i * 40, color));
  }
}

function spawnMixedRings(p, y) {
  const positions = [0.25, 0.5, 0.75];
  for (let i = 0; i < 3; i++) {
    const x = COURSE_X_OFFSET + positions[i] * COURSE_WIDTH;
    const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    gameState.rings.push(new Ring(x, y - i * 25, color));
  }
}

export function spawnObstacles(p) {
  const minSpacing = 1500;
  
  if (gameState.distance - gameState.lastObstacleSpawn > minSpacing) {
    const types = ['HURDLE', 'POOL', 'ZIPLINE'];
    const weights = [3, 2, 1]; // Favor easier obstacles early
    
    let totalWeight = 0;
    for (let w of weights) totalWeight += w;
    
    let rand = Math.random() * totalWeight;
    let type = types[0];
    
    for (let i = 0; i < types.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        type = types[i];
        break;
      }
    }
    
    gameState.obstacles.push(new Obstacle(type, -100));
    gameState.lastObstacleSpawn = gameState.distance;
  }
}