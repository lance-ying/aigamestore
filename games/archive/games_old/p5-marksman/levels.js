// levels.js - Level definitions and configurations

export const levelDefinitions = [
  {
    level: 1,
    name: "Training Day",
    objective: "Eliminate 3 static targets",
    timeLimit: 90,
    ammoClip: 100,
    ammoReserve: 100,
    targets: [
      { type: "hostile", x: 200, y: 200, moving: false, path: [], hitboxRadius: 25, headRadius: 10 },
      { type: "hostile", x: 400, y: 180, moving: false, path: [], hitboxRadius: 25, headRadius: 10 },
      { type: "hostile", x: 300, y: 250, moving: false, path: [], hitboxRadius: 25, headRadius: 10 }
    ],
    civilians: [],
    bgColor: [135, 206, 235]
  },
  {
    level: 2,
    name: "Downtown Recon",
    objective: "Eliminate 3 targets (1 moving)",
    timeLimit: 120,
    ammoClip: 5,
    ammoReserve: 5,
    targets: [
      { type: "hostile", x: 150, y: 200, moving: false, path: [], hitboxRadius: 22, headRadius: 9 },
      { type: "hostile", x: 450, y: 220, moving: false, path: [], hitboxRadius: 22, headRadius: 9 },
      { 
        type: "hostile", 
        x: 300, 
        y: 180, 
        moving: true, 
        path: [{x: 250, y: 180}, {x: 350, y: 180}], 
        speed: 0.5,
        hitboxRadius: 22, 
        headRadius: 9 
      }
    ],
    civilians: [],
    bgColor: [100, 149, 237]
  },
  {
    level: 3,
    name: "Market Mayhem",
    objective: "Eliminate 2 targets (avoid civilians)",
    timeLimit: 150,
    ammoClip: 5,
    ammoReserve: 10,
    targets: [
      { 
        type: "hostile", 
        x: 200, 
        y: 200, 
        moving: true, 
        path: [{x: 180, y: 200}, {x: 220, y: 200}], 
        speed: 0.4,
        hitboxRadius: 20, 
        headRadius: 8 
      },
      { 
        type: "hostile", 
        x: 400, 
        y: 220, 
        moving: true, 
        path: [{x: 380, y: 220}, {x: 420, y: 220}], 
        speed: 0.6,
        hitboxRadius: 20, 
        headRadius: 8 
      }
    ],
    civilians: [
      { x: 300, y: 190, moving: true, path: [{x: 280, y: 190}, {x: 320, y: 190}], speed: 0.3, hitboxRadius: 20 },
      { x: 250, y: 250, moving: true, path: [{x: 230, y: 250}, {x: 270, y: 250}], speed: 0.35, hitboxRadius: 20 }
    ],
    bgColor: [176, 196, 222]
  },
  {
    level: 4,
    name: "Nightfall Surveillance",
    objective: "Eliminate 3 moving targets (low visibility)",
    timeLimit: 180,
    ammoClip: 5,
    ammoReserve: 10,
    targets: [
      { 
        type: "hostile", 
        x: 180, 
        y: 200, 
        moving: true, 
        path: [{x: 150, y: 200}, {x: 210, y: 200}], 
        speed: 0.5,
        hitboxRadius: 18, 
        headRadius: 7 
      },
      { 
        type: "hostile", 
        x: 350, 
        y: 180, 
        moving: true, 
        path: [{x: 320, y: 180}, {x: 380, y: 180}], 
        speed: 0.6,
        hitboxRadius: 18, 
        headRadius: 7 
      },
      { 
        type: "hostile", 
        x: 450, 
        y: 230, 
        moving: true, 
        path: [{x: 430, y: 230}, {x: 470, y: 230}], 
        speed: 0.55,
        hitboxRadius: 18, 
        headRadius: 7 
      }
    ],
    civilians: [],
    bgColor: [25, 25, 112],
    darkMode: true
  },
  {
    level: 5,
    name: "The Final Strike",
    objective: "Eliminate high-priority target + 2 guards",
    timeLimit: 200,
    ammoClip: 5,
    ammoReserve: 15,
    targets: [
      { type: "hostile", x: 250, y: 200, moving: false, path: [], hitboxRadius: 20, headRadius: 8 },
      { type: "hostile", x: 350, y: 200, moving: false, path: [], hitboxRadius: 20, headRadius: 8 },
      { 
        type: "hostile", 
        x: 300, 
        y: 180, 
        moving: true, 
        path: [{x: 250, y: 180}, {x: 350, y: 180}, {x: 300, y: 220}, {x: 250, y: 180}], 
        speed: 0.8,
        hitboxRadius: 18, 
        headRadius: 7,
        isPriority: true
      }
    ],
    civilians: [],
    bgColor: [70, 130, 180]
  }
];