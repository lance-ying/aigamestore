// levels.js - Level configurations

import { ITEM_TYPES } from './globals.js';

export const LEVEL_CONFIGS = [
  {
    level: 1,
    timeLimit: 45,
    items: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 1, gridY: 1 },
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 3, gridY: 1 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 5, gridY: 1 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 2, gridY: 3 }
    ],
    containers: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 1, gridY: 4 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 6, gridY: 4 }
    ]
  },
  {
    level: 2,
    timeLimit: 50,
    items: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 1, gridY: 0 },
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 4, gridY: 1 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 6, gridY: 0 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 2, gridY: 2 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 5, gridY: 2 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 1, gridY: 3 }
    ],
    containers: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 0, gridY: 4 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 3, gridY: 4 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 6, gridY: 4 }
    ]
  },
  {
    level: 3,
    timeLimit: 60,
    items: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 0, gridY: 0 },
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 3, gridY: 1 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 6, gridY: 0 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 1, gridY: 2 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 4, gridY: 1 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 7, gridY: 2 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 2, gridY: 3 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 5, gridY: 3 }
    ],
    containers: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 0, gridY: 4 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 2, gridY: 4 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 4, gridY: 4 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 6, gridY: 4 }
    ]
  },
  {
    level: 4,
    timeLimit: 70,
    items: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 0, gridY: 0 },
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 4, gridY: 0 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 2, gridY: 1 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 6, gridY: 1 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 1, gridY: 2 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 5, gridY: 2 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 3, gridY: 2 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 7, gridY: 2 },
      { type: ITEM_TYPES.PURPLE_HEXAGON, gridX: 2, gridY: 3 },
      { type: ITEM_TYPES.PURPLE_HEXAGON, gridX: 6, gridY: 3 }
    ],
    containers: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 0, gridY: 4 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 2, gridY: 4 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 3, gridY: 4 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 5, gridY: 4 },
      { type: ITEM_TYPES.PURPLE_HEXAGON, gridX: 7, gridY: 4 }
    ]
  },
  {
    level: 5,
    timeLimit: 80,
    items: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 0, gridY: 0 },
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 3, gridY: 0 },
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 6, gridY: 0 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 1, gridY: 1 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 5, gridY: 1 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 2, gridY: 2 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 7, gridY: 1 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 4, gridY: 2 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 0, gridY: 3 },
      { type: ITEM_TYPES.PURPLE_HEXAGON, gridX: 3, gridY: 3 },
      { type: ITEM_TYPES.PURPLE_HEXAGON, gridX: 6, gridY: 3 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 1, gridY: 3 }
    ],
    containers: [
      { type: ITEM_TYPES.RED_CIRCLE, gridX: 0, gridY: 4 },
      { type: ITEM_TYPES.BLUE_SQUARE, gridX: 2, gridY: 4 },
      { type: ITEM_TYPES.GREEN_TRIANGLE, gridX: 4, gridY: 4 },
      { type: ITEM_TYPES.YELLOW_DIAMOND, gridX: 5, gridY: 4 },
      { type: ITEM_TYPES.PURPLE_HEXAGON, gridX: 7, gridY: 4 }
    ]
  }
];