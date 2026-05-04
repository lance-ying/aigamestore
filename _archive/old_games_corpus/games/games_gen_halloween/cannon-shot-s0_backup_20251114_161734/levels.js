// levels.js - Level configurations

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export const levels = [
  // Level 1 - Very Easy: 2 buckets, generous ball count, simple positioning
  {
    level: 1,
    ballCount: 15,
    buckets: [
      { x: 180, y: CANVAS_HEIGHT - 40 },
      { x: 420, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 250, y: 200, width: 100, height: 10, angle: 0.2, type: 'ramp' },
      { x: 380, y: 180, width: 100, height: 10, angle: -0.2, type: 'ramp' }
    ]
  },
  
  // Level 2 - Easy: 2 buckets, still generous, slightly trickier angles
  {
    level: 2,
    ballCount: 12,
    buckets: [
      { x: 150, y: CANVAS_HEIGHT - 40 },
      { x: 450, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 280, y: 180, width: 90, height: 10, angle: 0.4, type: 'ramp' },
      { x: 420, y: 150, width: 80, height: 10, angle: -0.5, type: 'ramp' }
    ]
  },
  
  // Level 3 - Medium: 3 buckets, need to think about routing
  {
    level: 3,
    ballCount: 12,
    buckets: [
      { x: 120, y: CANVAS_HEIGHT - 40 },
      { x: 300, y: CANVAS_HEIGHT - 40 },
      { x: 480, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 220, y: 180, width: 90, height: 10, angle: 0.5, type: 'ramp' },
      { x: 380, y: 200, width: 80, height: 10, angle: -0.4, type: 'ramp' },
      { x: 300, y: 120, width: 40, height: 40, angle: 0, type: 'deflector' }
    ]
  },
  
  // Level 4 - Medium-Hard: 3 buckets at different heights, fewer balls
  {
    level: 4,
    ballCount: 10,
    buckets: [
      { x: 140, y: CANVAS_HEIGHT - 40 },
      { x: 300, y: CANVAS_HEIGHT - 100 },
      { x: 460, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 200, y: 150, width: 100, height: 10, angle: 0.6, type: 'ramp' },
      { x: 340, y: 180, width: 80, height: 10, angle: -0.3, type: 'ramp' },
      { x: 430, y: 130, width: 90, height: 10, angle: 0.5, type: 'ramp' },
      { x: 270, y: 100, width: 35, height: 35, angle: 0.2, type: 'deflector' }
    ]
  },
  
  // Level 5 - Hard: 4 buckets, limited balls, complex routing
  {
    level: 5,
    ballCount: 10,
    buckets: [
      { x: 100, y: CANVAS_HEIGHT - 40 },
      { x: 240, y: CANVAS_HEIGHT - 70 },
      { x: 380, y: CANVAS_HEIGHT - 70 },
      { x: 520, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 180, y: 160, width: 85, height: 10, angle: 0.7, type: 'ramp' },
      { x: 310, y: 140, width: 75, height: 10, angle: -0.6, type: 'ramp' },
      { x: 440, y: 170, width: 80, height: 10, angle: 0.5, type: 'ramp' },
      { x: 250, y: 90, width: 35, height: 35, angle: 0.3, type: 'deflector' },
      { x: 380, y: 100, width: 35, height: 35, angle: -0.3, type: 'deflector' }
    ]
  },
  
  // Level 6 - Very Hard: 4 buckets, very limited balls, precise positioning required
  {
    level: 6,
    ballCount: 8,
    buckets: [
      { x: 120, y: CANVAS_HEIGHT - 40 },
      { x: 260, y: CANVAS_HEIGHT - 100 },
      { x: 400, y: CANVAS_HEIGHT - 100 },
      { x: 500, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 190, y: 140, width: 80, height: 10, angle: 0.8, type: 'ramp' },
      { x: 310, y: 120, width: 70, height: 10, angle: -0.7, type: 'ramp' },
      { x: 420, y: 150, width: 75, height: 10, angle: 0.6, type: 'ramp' },
      { x: 240, y: 80, width: 30, height: 30, angle: 0.4, type: 'deflector' },
      { x: 360, y: 85, width: 30, height: 30, angle: -0.4, type: 'deflector' },
      { x: 300, y: 200, width: 60, height: 10, angle: 0, type: 'ramp' }
    ]
  }
];

export function getLevelConfig(levelNum) {
  const index = (levelNum - 1) % levels.length;
  return levels[index];
}

export function getTotalLevels() {
  return levels.length;
}