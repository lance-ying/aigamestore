import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export const OBJECT_TYPES = {
  RAMP: 'RAMP',
  BUMPER: 'BUMPER',
  PLATFORM: 'PLATFORM'
};

export function getLevelConfig(levelNum) {
  const configs = {
    1: {
      buckets: [
        { x: 150, y: CANVAS_HEIGHT - 40, width: 80, height: 40, color: [255, 100, 100], required: 8 },
        { x: 450, y: CANVAS_HEIGHT - 40, width: 80, height: 40, color: [100, 100, 255], required: 8 }
      ],
      availableObjects: [
        { type: OBJECT_TYPES.RAMP, count: 2 },
        { type: OBJECT_TYPES.BUMPER, count: 1 }
      ],
      obstacles: []
    },
    2: {
      buckets: [
        { x: 100, y: CANVAS_HEIGHT - 40, width: 70, height: 40, color: [255, 100, 100], required: 6 },
        { x: 265, y: CANVAS_HEIGHT - 40, width: 70, height: 40, color: [100, 255, 100], required: 6 },
        { x: 430, y: CANVAS_HEIGHT - 40, width: 70, height: 40, color: [100, 100, 255], required: 6 }
      ],
      availableObjects: [
        { type: OBJECT_TYPES.RAMP, count: 3 },
        { type: OBJECT_TYPES.BUMPER, count: 2 }
      ],
      obstacles: [
        { x: 300, y: 200, width: 100, height: 20, angle: 0 }
      ]
    },
    3: {
      buckets: [
        { x: 80, y: CANVAS_HEIGHT - 40, width: 60, height: 40, color: [255, 100, 100], required: 5 },
        { x: 200, y: CANVAS_HEIGHT - 40, width: 60, height: 40, color: [100, 255, 100], required: 5 },
        { x: 320, y: CANVAS_HEIGHT - 40, width: 60, height: 40, color: [100, 100, 255], required: 5 },
        { x: 440, y: CANVAS_HEIGHT - 40, width: 60, height: 40, color: [255, 255, 100], required: 5 }
      ],
      availableObjects: [
        { type: OBJECT_TYPES.RAMP, count: 2 },
        { type: OBJECT_TYPES.BUMPER, count: 3 },
        { type: OBJECT_TYPES.PLATFORM, count: 1 }
      ],
      obstacles: [
        { x: 150, y: 250, width: 80, height: 20, angle: 0.3 },
        { x: 450, y: 250, width: 80, height: 20, angle: -0.3 }
      ]
    },
    4: {
      buckets: [
        { x: 100, y: CANVAS_HEIGHT - 40, width: 70, height: 40, color: [255, 100, 100], required: 7 },
        { x: 300, y: CANVAS_HEIGHT - 40, width: 70, height: 40, color: [100, 255, 100], required: 7 },
        { x: 500, y: CANVAS_HEIGHT - 40, width: 70, height: 40, color: [100, 100, 255], required: 6 }
      ],
      availableObjects: [
        { type: OBJECT_TYPES.RAMP, count: 3 },
        { type: OBJECT_TYPES.BUMPER, count: 2 },
        { type: OBJECT_TYPES.PLATFORM, count: 1 }
      ],
      obstacles: [
        { x: 200, y: 180, width: 60, height: 20, angle: 0.5 },
        { x: 400, y: 180, width: 60, height: 20, angle: -0.5 },
        { x: 300, y: 280, width: 100, height: 20, angle: 0 }
      ]
    },
    5: {
      buckets: [
        { x: 70, y: CANVAS_HEIGHT - 40, width: 55, height: 40, color: [255, 100, 100], required: 4 },
        { x: 180, y: CANVAS_HEIGHT - 40, width: 55, height: 40, color: [100, 255, 100], required: 4 },
        { x: 290, y: CANVAS_HEIGHT - 40, width: 55, height: 40, color: [100, 100, 255], required: 4 },
        { x: 400, y: CANVAS_HEIGHT - 40, width: 55, height: 40, color: [255, 255, 100], required: 4 },
        { x: 510, y: CANVAS_HEIGHT - 40, width: 55, height: 40, color: [255, 100, 255], required: 4 }
      ],
      availableObjects: [
        { type: OBJECT_TYPES.RAMP, count: 3 },
        { type: OBJECT_TYPES.BUMPER, count: 3 },
        { type: OBJECT_TYPES.PLATFORM, count: 2 }
      ],
      obstacles: [
        { x: 150, y: 150, width: 70, height: 20, angle: 0.4 },
        { x: 300, y: 200, width: 100, height: 20, angle: 0 },
        { x: 450, y: 150, width: 70, height: 20, angle: -0.4 }
      ]
    }
  };
  
  // If level doesn't exist, generate a harder variant
  if (!configs[levelNum]) {
    const baseLevel = configs[5];
    const numBuckets = Math.min(5, 3 + Math.floor(levelNum / 3));
    return {
      ...baseLevel,
      buckets: baseLevel.buckets.slice(0, numBuckets).map(b => ({
        ...b,
        required: Math.min(8, 4 + Math.floor(levelNum / 2))
      })),
      availableObjects: [
        { type: OBJECT_TYPES.RAMP, count: Math.min(4, 2 + Math.floor(levelNum / 4)) },
        { type: OBJECT_TYPES.BUMPER, count: Math.min(4, 2 + Math.floor(levelNum / 4)) },
        { type: OBJECT_TYPES.PLATFORM, count: Math.min(3, 1 + Math.floor(levelNum / 5)) }
      ]
    };
  }
  
  return configs[levelNum];
}

export function checkCannonUnlock(level) {
  // Unlock new cannon every 10 levels
  const cannonIndex = Math.floor(level / 10);
  return cannonIndex;
}