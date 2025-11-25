// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1200;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const BIOME_TYPES = {
  SAFE_SHALLOWS: "SAFE_SHALLOWS",
  TWISTY_BRIDGES: "TWISTY_BRIDGES",
  CRYSTAL_CAVERNS: "CRYSTAL_CAVERNS",
  GLACIAL_BASIN: "GLACIAL_BASIN",
  THERMAL_VENTS: "THERMAL_VENTS",
  DEEP_TRENCH: "DEEP_TRENCH"
};

export const ENTITY_TYPES = {
  PLAYER: "PLAYER",
  RESOURCE: "RESOURCE",
  ARTIFACT: "ARTIFACT",
  HABITAT: "HABITAT",
  LEVIATHAN: "LEVIATHAN",
  PENGWING: "PENGWING",
  THERMAL_LILY: "THERMAL_LILY"
};

export const RESOURCE_TYPES = {
  TITANIUM: "TITANIUM",
  COPPER: "COPPER",
  QUARTZ: "QUARTZ"
};

export const gameState = {
  player: null,
  entities: [],
  camera: { x: 0, y: 0 },
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  resources: {
    TITANIUM: 0,
    COPPER: 0,
    QUARTZ: 0
  },
  artifactsCollected: 0,
  totalArtifacts: 3,
  biomes: [],
  habitats: [],
  frameCount: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;