// waves.js - Wave and level configuration
import { Enemy } from './entities.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export const WAVE_CONFIG = {
  1: { // Level 1
    1: { enemies: [{ type: 'grunt', count: 8 }], duration: 30 },
    2: { enemies: [{ type: 'grunt', count: 12 }, { type: 'ranged', count: 3 }], duration: 35 },
    3: { enemies: [{ type: 'grunt', count: 15 }, { type: 'ranged', count: 5 }], duration: 40 }
  },
  2: { // Level 2
    1: { enemies: [{ type: 'grunt', count: 15 }, { type: 'ranged', count: 5 }], duration: 35 },
    2: { enemies: [{ type: 'grunt', count: 12 }, { type: 'ranged', count: 5 }, { type: 'charger', count: 3 }], duration: 40 },
    3: { enemies: [{ type: 'grunt', count: 15 }, { type: 'ranged', count: 8 }, { type: 'charger', count: 5 }], duration: 45 },
    4: { enemies: [{ type: 'grunt', count: 10 }, { type: 'ranged', count: 6 }, { type: 'charger', count: 4 }, { type: 'elite', count: 1 }], duration: 50 }
  },
  3: { // Level 3
    1: { enemies: [{ type: 'grunt', count: 20 }, { type: 'ranged', count: 10 }, { type: 'charger', count: 5 }], duration: 40 },
    2: { enemies: [{ type: 'grunt', count: 15 }, { type: 'ranged', count: 8 }, { type: 'charger', count: 8 }, { type: 'elite', count: 2 }], duration: 45 },
    3: { enemies: [{ type: 'grunt', count: 10 }, { type: 'ranged', count: 10 }, { type: 'charger', count: 6 }, { type: 'elite', count: 3 }], duration: 50 },
    4: { enemies: [{ type: 'grunt', count: 25 }, { type: 'ranged', count: 12 }, { type: 'charger', count: 10 }, { type: 'elite', count: 2 }], duration: 55 },
    5: { enemies: [{ type: 'grunt', count: 15 }, { type: 'ranged', count: 8 }, { type: 'charger', count: 5 }, { type: 'boss', count: 1 }], duration: 90 }
  }
};

export function spawnWave(p, level, wave) {
  const config = WAVE_CONFIG[level][wave];
  if (!config) return [];
  
  const enemies = [];
  
  for (const enemyGroup of config.enemies) {
    for (let i = 0; i < enemyGroup.count; i++) {
      const pos = getSpawnPosition(p);
      const enemy = new Enemy(pos.x, pos.y, enemyGroup.type);
      enemies.push(enemy);
    }
  }
  
  return enemies;
}

function getSpawnPosition(p) {
  const side = Math.floor(p.random(4));
  let x, y;
  
  switch (side) {
    case 0: // Top
      x = p.random(CANVAS_WIDTH);
      y = -20;
      break;
    case 1: // Right
      x = CANVAS_WIDTH + 20;
      y = p.random(CANVAS_HEIGHT);
      break;
    case 2: // Bottom
      x = p.random(CANVAS_WIDTH);
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // Left
      x = -20;
      y = p.random(CANVAS_HEIGHT);
      break;
  }
  
  return { x, y };
}

export function getWaveDuration(level, wave) {
  const config = WAVE_CONFIG[level][wave];
  return config ? config.duration * 60 : 1800; // Convert to frames
}

export function hasNextWave(level, wave) {
  return WAVE_CONFIG[level] && WAVE_CONFIG[level][wave + 1];
}

export function hasNextLevel(level) {
  return WAVE_CONFIG[level + 1] !== undefined;
}