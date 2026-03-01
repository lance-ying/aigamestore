export const LEVELS = [
  {
    // Level 1: Basics
    id: 1,
    description: "Drop a line.",
    spawnY: 100,
    spawnXStart: 200,
    targets: [{x: 300, y: 350}],
    obstacles: [
      {x: 300, y: 380, w: 600, h: 40} // Floor
    ]
  },
  {
    // Level 2: Rolling
    id: 2,
    description: "Let it roll.",
    spawnY: 100,
    spawnXStart: 150,
    targets: [{x: 350, y: 350}],
    obstacles: [
      {x: 300, y: 380, w: 600, h: 40}, // Floor
      {x: 150, y: 200, w: 200, h: 20, angle: 0.4} // Ramp down-right
    ]
  },
  {
    // Level 3: The Split
    id: 3,
    description: "Use spaces to aim.",
    spawnY: 50,
    spawnXStart: 200,
    targets: [{x: 500, y: 350}],
    obstacles: [
      {x: 300, y: 380, w: 600, h: 40}, // Floor
      {x: 300, y: 200, w: 100, h: 100, angle: 0.785} // Diamond wedge in center
    ]
  },
  {
    // Level 4: The Funnel
    id: 4,
    description: "Funnel down.",
    spawnY: 50,
    spawnXStart: 250,
    targets: [{x: 300, y: 350}],
    obstacles: [
      {x: 170, y: 200, w: 300, h: 20, angle: 0.8}, // Left wall
      {x: 430, y: 200, w: 300, h: 20, angle: -0.8}, // Right wall
      {x: 300, y: 380, w: 100, h: 20} // Catch basin
    ]
  },
  {
    // Level 5: Domino
    id: 5,
    description: "Knock it over.",
    spawnY: 100,
    spawnXStart: 100,
    targets: [{x: 550, y: 350}],
    obstacles: [
      {x: 300, y: 380, w: 600, h: 40},
      {x: 400, y: 300, w: 20, h: 120, isStatic: false, density: 0.002}, // Dynamic tall block
    ]
  }
];