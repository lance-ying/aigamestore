// levels.js - Level definitions

export const levels = [
  // Level 1: The Training Grounds (now with a hostage to introduce the mechanic)
  {
    number: 1,
    name: "The Training Grounds",
    enemies: [
      { type: 'normal', spawnX: 200, spawnY: 50, path: [{x: 200, y: 350}] },
      { type: 'normal', spawnX: 300, spawnY: 50, path: [{x: 300, y: 350}] },
      { type: 'normal', spawnX: 400, spawnY: 50, path: [{x: 400, y: 350}] },
      { type: 'normal', spawnX: 250, spawnY: 30, path: [{x: 250, y: 350}] },
      { type: 'normal', spawnX: 350, spawnY: 30, path: [{x: 350, y: 350}] }
    ],
    barrels: [],
    boxes: [],
    hostages: [
      { x: 300, y: 370 }
    ]
  },
  
  // Level 2: Barrel Practice
  {
    number: 2,
    name: "Barrel Practice",
    enemies: [
      { type: 'normal', spawnX: 150, spawnY: 50, path: [{x: 200, y: 150}, {x: 250, y: 150}] },
      { type: 'normal', spawnX: 450, spawnY: 50, path: [{x: 400, y: 150}, {x: 350, y: 150}] },
      { type: 'normal', spawnX: 200, spawnY: 30, path: [{x: 200, y: 200}, {x: 300, y: 200}] },
      { type: 'normal', spawnX: 400, spawnY: 30, path: [{x: 400, y: 200}, {x: 300, y: 200}] },
      { type: 'normal', spawnX: 300, spawnY: 50, path: [{x: 300, y: 250}] },
      { type: 'normal', spawnX: 250, spawnY: 70, path: [{x: 250, y: 180}] },
      { type: 'normal', spawnX: 350, spawnY: 70, path: [{x: 350, y: 180}] }
    ],
    barrels: [
      { x: 230, y: 150 },
      { x: 370, y: 150 }
    ],
    boxes: [],
    hostages: [
      { x: 500, y: 350 }
    ]
  },
  
  // Level 3: The Stun Zone
  {
    number: 3,
    name: "The Stun Zone",
    enemies: [
      { type: 'normal', spawnX: 150, spawnY: 50, path: [{x: 150, y: 200}, {x: 250, y: 200}] },
      { type: 'normal', spawnX: 450, spawnY: 50, path: [{x: 450, y: 200}, {x: 350, y: 200}] },
      { type: 'fast', spawnX: 200, spawnY: 30, path: [{x: 300, y: 150}, {x: 300, y: 300}] },
      { type: 'fast', spawnX: 400, spawnY: 30, path: [{x: 300, y: 150}, {x: 300, y: 300}] },
      { type: 'normal', spawnX: 300, spawnY: 50, path: [{x: 300, y: 250}] },
      { type: 'normal', spawnX: 250, spawnY: 70, path: [{x: 200, y: 250}] },
      { type: 'normal', spawnX: 350, spawnY: 70, path: [{x: 400, y: 250}] },
      { type: 'normal', spawnX: 100, spawnY: 100, path: [{x: 150, y: 300}] },
      { type: 'normal', spawnX: 500, spawnY: 100, path: [{x: 450, y: 300}] },
      { type: 'normal', spawnX: 300, spawnY: 20, path: [{x: 300, y: 200}] }
    ],
    barrels: [],
    boxes: [
      { x: 200, y: 180 },
      { x: 300, y: 180 },
      { x: 400, y: 180 }
    ],
    hostages: [
      { x: 150, y: 350 },
      { x: 450, y: 350 }
    ]
  },
  
  // Level 4: Hostage Rescue
  {
    number: 4,
    name: "Hostage Rescue",
    enemies: [
      { type: 'normal', spawnX: 100, spawnY: 50, path: [{x: 100, y: 200}, {x: 200, y: 200}] },
      { type: 'normal', spawnX: 500, spawnY: 50, path: [{x: 500, y: 200}, {x: 400, y: 200}] },
      { type: 'fast', spawnX: 150, spawnY: 30, path: [{x: 150, y: 250}] },
      { type: 'fast', spawnX: 450, spawnY: 30, path: [{x: 450, y: 250}] },
      { type: 'fast', spawnX: 300, spawnY: 20, path: [{x: 300, y: 150}, {x: 200, y: 250}] },
      { type: 'normal', spawnX: 200, spawnY: 60, path: [{x: 200, y: 280}] },
      { type: 'normal', spawnX: 400, spawnY: 60, path: [{x: 400, y: 280}] },
      { type: 'normal', spawnX: 250, spawnY: 80, path: [{x: 250, y: 200}] },
      { type: 'normal', spawnX: 350, spawnY: 80, path: [{x: 350, y: 200}] },
      { type: 'normal', spawnX: 300, spawnY: 40, path: [{x: 300, y: 220}] },
      { type: 'normal', spawnX: 120, spawnY: 100, path: [{x: 120, y: 300}] },
      { type: 'tank', spawnX: 300, spawnY: 50, path: [{x: 300, y: 250}] }
    ],
    barrels: [
      { x: 180, y: 180 },
      { x: 420, y: 180 }
    ],
    boxes: [
      { x: 300, y: 150 }
    ],
    hostages: [
      { x: 120, y: 350 },
      { x: 300, y: 330 },
      { x: 480, y: 350 }
    ]
  },
  
  // Level 5: The Final Gauntlet
  {
    number: 5,
    name: "The Final Gauntlet",
    enemies: [
      { type: 'normal', spawnX: 100, spawnY: 50, path: [{x: 100, y: 200}, {x: 150, y: 300}] },
      { type: 'normal', spawnX: 500, spawnY: 50, path: [{x: 500, y: 200}, {x: 450, y: 300}] },
      { type: 'fast', spawnX: 150, spawnY: 30, path: [{x: 200, y: 150}, {x: 200, y: 320}] },
      { type: 'fast', spawnX: 450, spawnY: 30, path: [{x: 400, y: 150}, {x: 400, y: 320}] },
      { type: 'fast', spawnX: 300, spawnY: 20, path: [{x: 300, y: 150}, {x: 250, y: 280}] },
      { type: 'fast', spawnX: 350, spawnY: 25, path: [{x: 300, y: 150}, {x: 350, y: 280}] },
      { type: 'normal', spawnX: 200, spawnY: 60, path: [{x: 200, y: 250}] },
      { type: 'normal', spawnX: 400, spawnY: 60, path: [{x: 400, y: 250}] },
      { type: 'normal', spawnX: 250, spawnY: 70, path: [{x: 250, y: 200}, {x: 200, y: 300}] },
      { type: 'normal', spawnX: 350, spawnY: 70, path: [{x: 350, y: 200}, {x: 400, y: 300}] },
      { type: 'normal', spawnX: 180, spawnY: 40, path: [{x: 180, y: 280}] },
      { type: 'normal', spawnX: 420, spawnY: 40, path: [{x: 420, y: 280}] },
      { type: 'normal', spawnX: 300, spawnY: 35, path: [{x: 300, y: 220}] },
      { type: 'normal', spawnX: 270, spawnY: 50, path: [{x: 270, y: 180}] },
      { type: 'tank', spawnX: 300, spawnY: 50, path: [{x: 300, y: 250}] }
    ],
    barrels: [
      { x: 180, y: 150 },
      { x: 300, y: 140 },
      { x: 420, y: 150 },
      { x: 230, y: 220 },
      { x: 370, y: 220 }
    ],
    boxes: [
      { x: 250, y: 180 },
      { x: 350, y: 180 }
    ],
    hostages: [
      { x: 100, y: 350 },
      { x: 250, y: 340 },
      { x: 350, y: 340 },
      { x: 500, y: 350 }
    ]
  }
];