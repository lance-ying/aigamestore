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

export const PLAY_PHASES = {
  SELECT_RACE: "SELECT_RACE",
  DEPLOY_TOKENS: "DEPLOY_TOKENS",
  AI_TURN: "AI_TURN",
  ROUND_END: "ROUND_END"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  playPhase: PLAY_PHASES.SELECT_RACE,
  controlMode: "HUMAN",
  
  // Game specific state
  currentRound: 1,
  maxRounds: 8,
  currentPlayer: 0,
  numPlayers: 2, // Player + 1 AI
  
  // Territory and map
  territories: [],
  selectedTerritory: null,
  hoveredTerritory: null,
  
  // Race combinations
  availableRaceCombos: [],
  selectedRaceCombo: null,
  
  // Players data
  players: [],
  
  // Deployment
  tokensToPlace: 0,
  deploymentHistory: [],
  
  // Turn state
  turnPhase: "WAITING", // WAITING, SELECTING, DEPLOYING, CONFIRMING
  
  // UI state
  messageQueue: [],
  currentMessage: "",
  
  // History for testing
  positionHistory: [],
  lastActionFrame: 0
};

export const RACES = [
  { name: "Elves", tokens: 6, bonus: "Defense +1" },
  { name: "Dwarves", tokens: 5, bonus: "Mountain bonus" },
  { name: "Orcs", tokens: 8, bonus: "Attack +1" },
  { name: "Humans", tokens: 7, bonus: "Farm bonus" },
  { name: "Goblins", tokens: 9, bonus: "Swarm bonus" }
];

export const ABILITIES = [
  { name: "Flying", effect: "Ignore terrain" },
  { name: "Fortified", effect: "Extra defense" },
  { name: "Wealthy", effect: "+2 points/turn" },
  { name: "Berserker", effect: "Reroll dice" },
  { name: "Seafaring", effect: "Cross water" }
];

export const TERRAIN_TYPES = {
  PLAINS: { name: "Plains", color: [144, 238, 144], defenseCost: 0 },
  FOREST: { name: "Forest", color: [34, 139, 34], defenseCost: 1 },
  MOUNTAIN: { name: "Mountain", color: [139, 137, 137], defenseCost: 2 },
  SWAMP: { name: "Swamp", color: [107, 142, 35], defenseCost: 1 },
  WATER: { name: "Water", color: [65, 105, 225], defenseCost: 999 }
};

// Helper to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}