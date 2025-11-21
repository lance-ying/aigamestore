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

export const PLAY_STATES = {
  SPINNING: "SPINNING",
  QUESTION: "QUESTION",
  FEEDBACK: "FEEDBACK",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

export const CATEGORIES = [
  { name: "Science", color: [65, 105, 225], icon: "⚗️" },
  { name: "History", color: [220, 20, 60], icon: "📜" },
  { name: "Sports", color: [50, 205, 50], icon: "⚽" },
  { name: "Art", color: [138, 43, 226], icon: "🎨" },
  { name: "Geography", color: [255, 140, 0], icon: "🌍" },
  { name: "Entertainment", color: [255, 20, 147], icon: "🎬" }
];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  playState: PLAY_STATES.SPINNING,
  controlMode: "HUMAN",
  
  // Player progress
  player: null,
  currentScore: 0,
  currentLevel: 1,
  livesRemaining: 0,
  
  // Question management
  selectedCategory: null,
  currentQuestion: null,
  selectedAnswerIndex: -1,
  questionStartTime: 0,
  timeLimit: 10,
  
  // Category crowns tracking
  categoryCorrectCounts: {},
  earnedCrowns: {},
  
  // Power-ups
  availablePowerups: {
    skip: 0,
    removeTwoWrong: 0
  },
  usedRemoveTwoWrong: false,
  
  // Wheel animation
  wheelAngle: 0,
  wheelSpeed: 0,
  wheelTargetCategory: 0,
  
  // Feedback
  feedbackMessage: "",
  feedbackColor: [0, 0, 0],
  feedbackTimer: 0,
  
  // Level configuration
  levelConfig: null,
  
  // Entities
  entities: [],
  
  // High score
  highScore: 0
};

// Initialize category tracking
CATEGORIES.forEach(cat => {
  gameState.categoryCorrectCounts[cat.name] = 0;
  gameState.earnedCrowns[cat.name] = false;
});

// Expose getGameState function
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}