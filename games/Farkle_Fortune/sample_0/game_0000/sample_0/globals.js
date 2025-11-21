// globals.js - Game constants and global state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const TURN_PHASES = {
  WAITING_TO_ROLL: "WAITING_TO_ROLL",
  ROLLING: "ROLLING",
  SELECTING: "SELECTING",
  AI_THINKING: "AI_THINKING",
  BANKING: "BANKING",
  FARKLE: "FARKLE"
};

export const PLAYERS = {
  PLAYER: "PLAYER",
  AI: "AI"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  turnPhase: TURN_PHASES.WAITING_TO_ROLL,
  controlMode: "HUMAN",
  
  // Player data
  player: null,
  playerScoreTotal: 0,
  aiScoreTotal: 0,
  currentTurnScore: 0,
  currentPlayer: PLAYERS.PLAYER,
  
  // Dice
  dice: [],
  selectedDiceIndices: [],
  remainingDiceToRoll: 6,
  
  // Level progression
  level: 1,
  targetScore: 5000,
  minBankScore: 300,
  
  // Animation states
  rollAnimationFrame: 0,
  rollAnimationDuration: 30,
  bankAnimationFrame: 0,
  farkleAnimationFrame: 0,
  animationDuration: 60,
  
  // UI state
  selectedDieIndex: 0,
  canBank: false,
  canRollAgain: false,
  
  // AI state
  aiDecisionDelay: 0,
  aiDecisionMade: false,
  
  entities: []
};

export const LEVEL_CONFIG = [
  { level: 1, name: "Novice Roll", targetScore: 5000, bgColor: [34, 139, 34], aiThreshold: 300 },
  { level: 2, name: "Skilled Gambler", targetScore: 7500, bgColor: [30, 60, 120], aiThreshold: 500 },
  { level: 3, name: "Farkle Master", targetScore: 10000, bgColor: [139, 0, 0], aiThreshold: 700 }
];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}