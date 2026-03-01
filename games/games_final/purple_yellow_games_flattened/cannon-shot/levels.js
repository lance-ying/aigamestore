// levels.js - Level configurations

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export const levels = [
  // Level 1 - Easy: 2 buckets, lots of balls, simple ramp
  {
    level: 1,
    ballCount: 20,
    buckets: [
      { x: 300, y: CANVAS_HEIGHT - 40 },
      { x: 450, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 250, y: 200, width: 120, height: 10, angle: 0.2, type: 'ramp' }
    ]
  },
  
  // Level 2 - Easy: 2 buckets, slightly more spread
  {
    level: 2,
    ballCount: 18,
    buckets: [
      { x: 350, y: CANVAS_HEIGHT - 40 },
      { x: 500, y: CANVAS_HEIGHT - 100 }
    ],
    movableObjects: [
      { x: 250, y: 180, width: 100, height: 10, angle: 0.1, type: 'ramp' },
      { x: 400, y: 220, width: 100, height: 10, angle: -0.2, type: 'ramp' }
    ]
  },
  
  // Level 3 - Medium: 3 buckets, reduced balls, introduces deflector
  {
    level: 3,
    ballCount: 15,
    buckets: [
      { x: 250, y: CANVAS_HEIGHT - 40 },
      { x: 400, y: CANVAS_HEIGHT - 40 },
      { x: 550, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 200, y: 150, width: 80, height: 10, angle: 0.4, type: 'ramp' },
      { x: 350, y: 250, width: 120, height: 10, angle: 0, type: 'ramp' },
      { x: 450, y: 150, width: 40, height: 40, angle: 0.8, type: 'deflector' }
    ]
  },
  
  // Level 4 - Medium: 3 buckets, obstacles and height differences
  {
    level: 4,
    ballCount: 12,
    buckets: [
      { x: 300, y: CANVAS_HEIGHT - 100 },
      { x: 400, y: CANVAS_HEIGHT - 40 },
      { x: 500, y: CANVAS_HEIGHT - 100 }
    ],
    movableObjects: [
      { x: 220, y: 180, width: 90, height: 10, angle: 0.5, type: 'ramp' },
      { x: 350, y: 120, width: 40, height: 40, angle: 0.2, type: 'deflector' },
      { x: 450, y: 200, width: 90, height: 10, angle: -0.3, type: 'ramp' }
    ]
  },
  
  // Level 5 - Hard: 4 buckets, tight ball count, complex routing
  {
    level: 5,
    ballCount: 10,
    buckets: [
      { x: 200, y: CANVAS_HEIGHT - 40 },
      { x: 320, y: CANVAS_HEIGHT - 80 },
      { x: 440, y: CANVAS_HEIGHT - 80 },
      { x: 560, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 180, y: 150, width: 80, height: 10, angle: 0.6, type: 'ramp' },
      { x: 300, y: 220, width: 80, height: 10, angle: -0.2, type: 'ramp' },
      { x: 400, y: 140, width: 35, height: 35, angle: 0.4, type: 'deflector' },
      { x: 500, y: 180, width: 80, height: 10, angle: 0.3, type: 'ramp' }
    ]
  },
  
  // Level 6 - Very Hard: 4 buckets, very limited balls, precise angles
  {
    level: 6,
    ballCount: 8,
    buckets: [
      { x: 250, y: CANVAS_HEIGHT - 120 },
      { x: 350, y: CANVAS_HEIGHT - 40 },
      { x: 450, y: CANVAS_HEIGHT - 120 },
      { x: 550, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 200, y: 140, width: 70, height: 10, angle: 0.5, type: 'ramp' },
      { x: 300, y: 100, width: 30, height: 30, angle: 0.7, type: 'deflector' },
      { x: 400, y: 180, width: 100, height: 10, angle: 0, type: 'ramp' },
      { x: 500, y: 120, width: 30, height: 30, angle: -0.5, type: 'deflector' },
      { x: 350, y: 250, width: 60, height: 10, angle: -0.2, type: 'ramp' }
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