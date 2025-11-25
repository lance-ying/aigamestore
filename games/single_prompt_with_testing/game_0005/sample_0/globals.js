// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 800;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PAL_TYPES = {
  FIRE: { name: "Flamepup", color: [255, 100, 50], skill: "mining", strength: 8 },
  WATER: { name: "Splashkit", color: [50, 150, 255], skill: "farming", strength: 6 },
  GRASS: { name: "Leafling", color: [100, 200, 50], skill: "farming", strength: 5 },
  ELECTRIC: { name: "Sparkrat", color: [255, 255, 100], skill: "factory", strength: 7 },
  EARTH: { name: "Rockbud", color: [150, 100, 50], skill: "building", strength: 9 }
};

export const WORKSTATION_TYPES = {
  FARM: { name: "Farm", color: [139, 69, 19], produces: "food", cost: 50, rate: 0.5 },
  MINE: { name: "Mine", color: [128, 128, 128], produces: "ore", cost: 100, rate: 0.3 },
  FACTORY: { name: "Factory", color: [100, 100, 150], produces: "materials", cost: 150, rate: 0.4 },
  BUILDER: { name: "Builder", color: [200, 150, 100], produces: "prosperity", cost: 200, rate: 1.0 }
};

export const gameState = {
  player: null,
  entities: [],
  pals: [],
  capturedPals: [],
  wildPals: [],
  poachers: [],
  workstations: [],
  projectiles: [],
  particles: [],
  camera: { x: 0, y: 0 },
  resources: {
    food: 100,
    ore: 0,
    materials: 0,
    prosperity: 0
  },
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  hunger: 100,
  lastFoodTime: 0,
  waveNumber: 0,
  lastWaveTime: 0,
  selectedPal: null,
  frameCount: 0
};

// Export function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}