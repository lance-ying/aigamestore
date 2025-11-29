// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const MATERIAL_TYPES = {
  ROAD: { name: "Road", cost: 50, strength: 100, color: [60, 60, 60], thickness: 8, stiffness: 0.9 },
  WOOD: { name: "Wood", cost: 25, strength: 50, color: [139, 90, 43], thickness: 4, stiffness: 0.7 },
  STEEL: { name: "Steel", cost: 100, strength: 200, color: [150, 150, 150], thickness: 3, stiffness: 0.95 },
  SPRING: { name: "Spring", cost: 75, strength: 80, color: [255, 100, 255], thickness: 5, stiffness: 0.3 }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Bridge building state
  currentMaterial: "ROAD",
  placedNodes: [],
  segments: [],
  cursor: { x: 150, y: 200 },
  anchorPoints: [],
  
  // Level state
  budget: 5000,
  maxBudget: 5000,
  spentBudget: 0,
  vehicles: [],
  vehiclesSpawned: 0,
  vehiclesCrossed: 0,
  totalVehicles: 3,
  
  // Simulation state
  isSimulating: false,
  simulationStarted: false,
  
  // Current level
  currentLevel: 1,
  
  // Terrain
  terrain: [],
  startPoint: { x: 50, y: 300 },
  endPoint: { x: 550, y: 300 }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;