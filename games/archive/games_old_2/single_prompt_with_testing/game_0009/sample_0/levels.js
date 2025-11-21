// levels.js - Level definitions and configuration

export const LEVELS = [
  {
    id: 1,
    name: "Simple Junction",
    description: "Connect one entry to one exit",
    entryPoints: [
      { x: 50, y: 200, direction: 0, spawnRate: 1.0 } // spawns per second
    ],
    exitPoints: [
      { x: 550, y: 200, direction: 0 }
    ],
    targetVehicles: 30,
    timeLimit: 60
  },
  {
    id: 2,
    name: "Two-Way Split",
    description: "Handle traffic going to two exits",
    entryPoints: [
      { x: 50, y: 200, direction: 0, spawnRate: 1.5 }
    ],
    exitPoints: [
      { x: 550, y: 150, direction: 0 },
      { x: 550, y: 250, direction: 0 }
    ],
    targetVehicles: 50,
    timeLimit: 60
  },
  {
    id: 3,
    name: "Merge Challenge",
    description: "Merge two entry points into one exit",
    entryPoints: [
      { x: 50, y: 150, direction: 0, spawnRate: 1.0 },
      { x: 50, y: 250, direction: 0, spawnRate: 1.0 }
    ],
    exitPoints: [
      { x: 550, y: 200, direction: 0 }
    ],
    targetVehicles: 60,
    timeLimit: 60
  },
  {
    id: 4,
    name: "Complex Interchange",
    description: "Multiple entries and exits",
    entryPoints: [
      { x: 50, y: 150, direction: 0, spawnRate: 1.2 },
      { x: 50, y: 250, direction: 0, spawnRate: 1.2 }
    ],
    exitPoints: [
      { x: 550, y: 120, direction: 0 },
      { x: 550, y: 220, direction: 0 },
      { x: 550, y: 280, direction: 0 }
    ],
    targetVehicles: 80,
    timeLimit: 60
  }
];

export function getLevelData(levelId) {
  return LEVELS.find(l => l.id === levelId) || LEVELS[0];
}