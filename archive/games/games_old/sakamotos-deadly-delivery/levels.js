// levels.js - Level definitions and configurations
export const levels = [
  {
    id: 1,
    name: "The Introductory Drop",
    maxTime: 60,
    maxObjects: { block: 5, ramp: 3, spring: 2 },
    startPos: { x: 50, y: 300 },
    goalPos: { x: 520, y: 320, width: 60, height: 60 },
    walls: [
      { x: 300, y: 390, width: 600, height: 20 }, // floor
      { x: 0, y: 200, width: 20, height: 400 }, // left wall
      { x: 580, y: 200, width: 20, height: 400 }, // right wall
      { x: 150, y: 350, width: 150, height: 20 }, // platform 1
      { x: 400, y: 350, width: 150, height: 20 }  // platform 2
    ],
    spikes: [],
    enemies: [],
    destructibleBlocks: []
  },
  {
    id: 2,
    name: "Guarded Passage",
    maxTime: 50,
    maxObjects: { block: 4, ramp: 3, spring: 2 },
    startPos: { x: 50, y: 250 },
    goalPos: { x: 520, y: 320, width: 60, height: 60 },
    walls: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 0, y: 200, width: 20, height: 400 },
      { x: 580, y: 200, width: 20, height: 400 },
      { x: 100, y: 300, width: 120, height: 20 },
      { x: 450, y: 350, width: 150, height: 20 }
    ],
    spikes: [
      { x: 280, y: 370, size: 20 },
      { x: 300, y: 370, size: 20 },
      { x: 320, y: 370, size: 20 }
    ],
    enemies: [
      { x: 350, y: 350, size: 30, type: 'static' }
    ],
    destructibleBlocks: []
  },
  {
    id: 3,
    name: "The Ascent",
    maxTime: 45,
    maxObjects: { block: 3, ramp: 3, spring: 3 },
    startPos: { x: 50, y: 320 },
    goalPos: { x: 520, y: 180, width: 60, height: 60 },
    walls: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 0, y: 200, width: 20, height: 400 },
      { x: 580, y: 200, width: 20, height: 400 },
      { x: 100, y: 350, width: 100, height: 20 },
      { x: 300, y: 280, width: 100, height: 20 },
      { x: 500, y: 210, width: 100, height: 20 }
    ],
    spikes: [
      { x: 240, y: 370, size: 20 },
      { x: 260, y: 370, size: 20 }
    ],
    enemies: [],
    destructibleBlocks: [
      { x: 250, y: 260, width: 40, height: 40 }
    ]
  },
  {
    id: 4,
    name: "Dynamic Threat",
    maxTime: 40,
    maxObjects: { block: 3, ramp: 2, spring: 2 },
    startPos: { x: 50, y: 300 },
    goalPos: { x: 520, y: 280, width: 60, height: 60 },
    walls: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 0, y: 200, width: 20, height: 400 },
      { x: 580, y: 200, width: 20, height: 400 },
      { x: 100, y: 330, width: 120, height: 20 },
      { x: 320, y: 330, width: 100, height: 20 },
      { x: 500, y: 310, width: 100, height: 20 }
    ],
    spikes: [
      { x: 270, y: 310, size: 20 },
      { x: 290, y: 310, size: 20 }
    ],
    enemies: [
      { x: 350, y: 300, size: 30, type: 'moving', path: [{ x: 300, y: 300 }, { x: 420, y: 300 }], speed: 1.5 }
    ],
    destructibleBlocks: []
  },
  {
    id: 5,
    name: "The Grand Finale",
    maxTime: 30,
    maxObjects: { block: 2, ramp: 2, spring: 2 },
    startPos: { x: 50, y: 320 },
    goalPos: { x: 520, y: 140, width: 60, height: 60 },
    walls: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 0, y: 200, width: 20, height: 400 },
      { x: 580, y: 200, width: 20, height: 400 },
      { x: 100, y: 350, width: 80, height: 20 },
      { x: 250, y: 290, width: 80, height: 20 },
      { x: 400, y: 220, width: 80, height: 20 },
      { x: 520, y: 170, width: 80, height: 20 }
    ],
    spikes: [
      { x: 200, y: 370, size: 20 },
      { x: 220, y: 370, size: 20 },
      { x: 350, y: 370, size: 20 },
      { x: 370, y: 370, size: 20 }
    ],
    enemies: [
      { x: 300, y: 260, size: 30, type: 'moving', path: [{ x: 250, y: 260 }, { x: 330, y: 260 }], speed: 2 },
      { x: 450, y: 190, size: 30, type: 'static' }
    ],
    destructibleBlocks: []
  }
];