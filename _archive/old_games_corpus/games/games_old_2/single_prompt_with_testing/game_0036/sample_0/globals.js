// globals.js - Global game state and constants
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
  
  // Player stats
  player: {
    charm: 50,
    wisdom: 50,
    courage: 50,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2
  },
  
  // Story progression
  currentChapter: 1,
  currentScene: 0,
  selectedOption: 0,
  
  // Collection systems
  inventory: [],
  hiddenStoriesFound: [],
  achievements: [],
  
  // Gameplay tracking
  score: 0,
  deathCount: 0,
  choicesMade: [],
  
  // UI state
  showingStats: false,
  dialogueComplete: false,
  transitioningChapter: false,
  
  // Entities
  entities: [],
  
  // Animation state
  animationFrame: 0,
  particleEffects: []
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}