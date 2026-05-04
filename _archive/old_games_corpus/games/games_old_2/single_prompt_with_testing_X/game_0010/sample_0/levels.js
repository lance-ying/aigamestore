// levels.js - Level configurations

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export const levels = [
  {
    level: 1,
    ballCount: 15,
    buckets: [
      { x: 150, y: CANVAS_HEIGHT - 40 },
      { x: 450, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 300, y: 200, width: 100, height: 10, angle: 0.3, type: 'ramp' },
      { x: 400, y: 150, width: 80, height: 10, angle: -0.4, type: 'ramp' }
    ]
  },
  {
    level: 2,
    ballCount: 12,
    buckets: [
      { x: 100, y: CANVAS_HEIGHT - 40 },
      { x: 300, y: CANVAS_HEIGHT - 40 },
      { x: 500, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 250, y: 180, width: 90, height: 10, angle: 0.5, type: 'ramp' },
      { x: 400, y: 200, width: 70, height: 10, angle: -0.5, type: 'ramp' },
      { x: 350, y: 120, width: 40, height: 40, angle: 0, type: 'deflector' }
    ]
  },
  {
    level: 3,
    ballCount: 10,
    buckets: [
      { x: 120, y: CANVAS_HEIGHT - 40 },
      { x: 300, y: CANVAS_HEIGHT - 100 },
      { x: 480, y: CANVAS_HEIGHT - 40 }
    ],
    movableObjects: [
      { x: 200, y: 150, width: 100, height: 10, angle: 0.6, type: 'ramp' },
      { x: 350, y: 180, width: 80, height: 10, angle: -0.3, type: 'ramp' },
      { x: 450, y: 120, width: 90, height: 10, angle: 0.4, type: 'ramp' },
      { x: 280, y: 100, width: 35, height: 35, angle: 0.2, type: 'deflector' }
    ]
  }
];

export function getLevelConfig(levelNum) {
  const index = (levelNum - 1) % levels.length;
  return levels[index];
}