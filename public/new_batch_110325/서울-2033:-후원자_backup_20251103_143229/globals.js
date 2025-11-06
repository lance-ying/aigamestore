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
  // Player stats
  player: null,
  health: 100,
  maxHealth: 100,
  stress: 0,
  maxStress: 100,
  money: 50,
  strength: 5,
  intelligence: 5,
  charisma: 5,
  
  // Game progression
  day: 1,
  score: 0,
  eventsCompleted: 0,
  
  // Current event
  currentEvent: null,
  selectedChoiceIndex: 0,
  eventHistory: [],
  isProcessingChoice: false, // Prevent multiple choice selections
  
  // Achievements
  achievements: [],
  unlockedEvents: [],
  
  // Game state
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // UI animation
  statChangeAnimations: [],
  messageQueue: [],
  
  entities: []
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}