import { Rope, Bubble, AirCushion, Platform, Star, Monster, Candy } from './entities.js';

export function createLevel1(p) {
  const levelData = {
    candy: { x: 300, y: 100 },
    ropes: [
      { x1: 300, y1: 50, x2: 300, y2: 100, attachToCandy: true }
    ],
    monsters: [
      { x: 150, y: 350, type: 'modern' },
      { x: 450, y: 350, type: 'ancient' }
    ],
    stars: [
      { x: 300, y: 200 },
      { x: 200, y: 300 },
      { x: 400, y: 300 }
    ],
    devices: [],
    platforms: [
      { x: 300, y: 390, width: 600, height: 20 }
    ]
  };
  
  return levelData;
}

export function createLevel2(p) {
  const levelData = {
    candy: { x: 150, y: 80 },
    ropes: [
      { x1: 100, y1: 50, x2: 150, y2: 80, attachToCandy: true },
      { x1: 200, y1: 50, x2: 150, y2: 80, attachToCandy: true }
    ],
    monsters: [
      { x: 100, y: 350, type: 'modern' },
      { x: 500, y: 350, type: 'ancient' }
    ],
    stars: [
      { x: 150, y: 180 },
      { x: 300, y: 250 },
      { x: 450, y: 180 }
    ],
    devices: [
      { type: 'bubble', x: 300, y: 200 }
    ],
    platforms: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 250, y: 300, width: 100, height: 15 }
    ]
  };
  
  return levelData;
}

export function createLevel3(p) {
  const levelData = {
    candy: { x: 300, y: 80 },
    ropes: [
      { x1: 300, y1: 50, x2: 300, y2: 80, attachToCandy: true }
    ],
    monsters: [
      { x: 150, y: 250, type: 'modern' },
      { x: 450, y: 250, type: 'ancient' }
    ],
    stars: [
      { x: 200, y: 150 },
      { x: 300, y: 200 },
      { x: 400, y: 150 }
    ],
    devices: [
      { type: 'cushion', x: 300, y: 340, width: 150 }
    ],
    platforms: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 150, y: 280, width: 120, height: 15 },
      { x: 450, y: 280, width: 120, height: 15 }
    ]
  };
  
  return levelData;
}

export function getLevelData(levelNumber, p) {
  switch(levelNumber) {
    case 1: return createLevel1(p);
    case 2: return createLevel2(p);
    case 3: return createLevel3(p);
    default: return createLevel1(p);
  }
}