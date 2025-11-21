export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const PHASE = {
  REINFORCE: 'REINFORCE',
  ATTACK: 'ATTACK',
  FORTIFY: 'FORTIFY',
  AI_TURN: 'AI_TURN'
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  currentLevel: 1,
  currentPhase: PHASE.REINFORCE,
  currentPlayerId: 0,
  territories: [],
  continents: [],
  selectedTerritoryId1: null,
  selectedTerritoryId2: null,
  reinforcementPool: 0,
  armiesToMove: 0,
  hasFortifiedThisTurn: false,
  players: [],
  combatResults: null,
  combatAnimationFrames: 0,
  turnNumber: 1
};

export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}