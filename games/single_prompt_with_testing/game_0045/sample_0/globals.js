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

export const CARD_TYPES = {
  PISTOL: { name: "PISTOL", color: [255, 100, 100], ability: "SHOOT", abilityName: "Shoot" },
  DASH: { name: "DASH", color: [100, 255, 100], ability: "DASH", abilityName: "Dash Forward" },
  JUMP: { name: "JUMP", color: [100, 100, 255], ability: "DOUBLE_JUMP", abilityName: "Double Jump" }
};

export const gameState = {
  player: null,
  entities: [],
  demons: [],
  cards: [],
  platforms: [],
  particles: [],
  score: 0,
  demonsKilled: 0,
  totalDemons: 0,
  completionTime: 0,
  startTime: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  levelComplete: false,
  currentCard: null,
  exitPortal: null
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}