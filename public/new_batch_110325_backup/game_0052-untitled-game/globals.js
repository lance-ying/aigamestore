// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Resources
  wood: 0,
  food: 0,
  fur: 0,
  
  // Fire state
  fireTemp: 0,
  maxFireTemp: 100,
  
  // Village
  population: 0,
  maxPopulation: 0,
  huts: 0,
  workshops: 0,
  
  // Unlocks
  unlockedActions: new Set(['lightFire', 'collectWood']),
  
  // Menu state
  selectedActionIndex: 0,
  availableActions: [],
  
  // Expedition state
  inExpedition: false,
  expeditionLocation: 'village',
  expeditionProgress: 0,
  playerHealth: 100,
  maxHealth: 100,
  supplies: 0,
  inCombat: false,
  enemyHealth: 0,
  enemyMaxHealth: 0,
  enemyName: '',
  combatLog: [],
  
  // Locations visited
  locationsVisited: new Set(['village']),
  
  // Time tracking
  framesSinceStart: 0,
  lastWoodGatherFrame: 0,
  lastFireDecayFrame: 0,
  lastPopulationCheckFrame: 0,
  
  // Player info for logging
  player: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2
  },
  
  // Narrative flags
  narrativeStage: 0,
  hasCompletedGame: false
};

// Action definitions
export const ACTIONS = {
  lightFire: { name: 'Light Fire', cost: { wood: 5 }, description: 'Stoke the fire' },
  collectWood: { name: 'Collect Wood', cost: {}, description: 'Gather wood from outside' },
  buildHut: { name: 'Build Hut', cost: { wood: 100 }, description: 'House for wanderers' },
  buildWorkshop: { name: 'Build Workshop', cost: { wood: 200, fur: 10 }, description: 'Automate wood gathering' },
  hunt: { name: 'Hunt', cost: { wood: 10 }, description: 'Hunt for food' },
  trap: { name: 'Set Trap', cost: { wood: 20 }, description: 'Trap for food and fur' },
  embark: { name: 'Embark', cost: { food: 50, wood: 100 }, description: 'Begin expedition' }
};

// Expedition locations
export const EXPEDITION_LOCATIONS = [
  { name: 'village', display: 'The Village', danger: 0 },
  { name: 'forest', display: 'Dark Forest', danger: 1 },
  { name: 'ruins', display: 'Ancient Ruins', danger: 2 },
  { name: 'mountains', display: 'Frozen Mountains', danger: 3 },
  { name: 'desert', display: 'Scorched Desert', danger: 4 },
  { name: 'city', display: 'Ancient City', danger: 5 }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;