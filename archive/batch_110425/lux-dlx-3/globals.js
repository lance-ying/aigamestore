// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  PAUSED: "PAUSED"
};

export const TURN_PHASES = {
  REINFORCEMENT: "REINFORCEMENT",
  DEPLOYMENT: "DEPLOYMENT",
  ATTACK: "ATTACK",
  FORTIFY: "FORTIFY"
};

export const PLAYER_COLORS = {
  HUMAN: [100, 150, 255],
  AI: [255, 100, 100]
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game specific state
  territories: [],
  players: [],
  currentPlayerIndex: 0,
  turnPhase: TURN_PHASES.REINFORCEMENT,
  selectedTerritory: null,
  attackingTerritory: null,
  reinforcementsToPlace: 0,
  cards: [],
  combatLog: [],
  turnNumber: 1,
  hoveredTerritoryIndex: 0,
  navigationIndex: 0,
  
  // AI state
  aiThinking: false,
  aiDelay: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}