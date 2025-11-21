// globals.js - Game constants and state management

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
  ROLL_DICE: "ROLL_DICE",
  SELECT_PIECE: "SELECT_PIECE",
  ANIMATE_MOVE: "ANIMATE_MOVE",
  TURN_END: "TURN_END"
};

export const PLAYERS = {
  PLAYER: "PLAYER",
  AI: "AI"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game state
  currentLevel: 1,
  currentScore: 0,
  highScore: 0,
  
  // Turn state
  currentPlayer: PLAYERS.PLAYER,
  currentTurnPhase: TURN_PHASES.ROLL_DICE,
  diceValue: 0,
  rollAgain: false,
  
  // Pieces
  playerPieces: [],
  aiPieces: [],
  
  // Selection
  eligiblePieces: [],
  selectedPieceIndex: 0,
  
  // Animation
  animatingPiece: null,
  animationProgress: 0,
  animationSteps: [],
  animationCurrentStep: 0,
  
  // Board
  boardPath: [],
  safeSpots: [],
  trapSpots: [],
  playerHomeEntryIndex: 50,
  aiHomeEntryIndex: 12,
  
  // Counters
  playerFinishedCount: 0,
  aiFinishedCount: 0,
  
  // Player reference for logging
  player: null
};

// Level configurations
export const LEVEL_CONFIGS = {
  1: {
    name: "Novice Neighbor",
    aiDifficulty: "BASIC",
    safeSpotCount: 6,
    aiStartingPieces: 0,
    aiStartingPositions: [],
    trapCount: 0
  },
  2: {
    name: "Crafty Competitor",
    aiDifficulty: "INTERMEDIATE",
    safeSpotCount: 4,
    aiStartingPieces: 2,
    aiStartingPositions: [5, 5],
    trapCount: 0
  },
  3: {
    name: "Master Strategist",
    aiDifficulty: "ADVANCED",
    safeSpotCount: 4,
    aiStartingPieces: 3,
    aiStartingPositions: [10, 10, 40],
    trapCount: 2
  }
};