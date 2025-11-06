// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  fuel: 100,
  maxFuel: 100,
  distance: 0,
  currentLevel: 1,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED", "LEVEL_COMPLETE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  camera: { x: 0, y: 0 },
  terrainSegments: [],
  fuelCanisters: [],
  lastFuelSpawnDistance: 0,
  framesSinceStart: 0,
  rotationAtLastCheck: 0,
  totalRotation: 0,
  airTimeFrames: 0,
  isInAir: false,
  vehicleStuckFrames: 0,
  vehicleUpsideDownFrames: 0,
  levelCompleteFrames: 0,
  particleEffects: []
};

export const LEVELS = [
  {
    level_number: 1,
    name: "Rolling Hills",
    track_length_meters: 1000,
    max_slope_degrees: 20,
    fuel_canister_frequency_meters: 175,
    terrain_complexity: 1
  },
  {
    level_number: 2,
    name: "Rocky Ascent",
    track_length_meters: 2000,
    max_slope_degrees: 35,
    fuel_canister_frequency_meters: 275,
    terrain_complexity: 2
  },
  {
    level_number: 3,
    name: "Mountain Pass",
    track_length_meters: 3500,
    max_slope_degrees: 55,
    fuel_canister_frequency_meters: 450,
    terrain_complexity: 3
  }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}