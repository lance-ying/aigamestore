// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game sub-states during PLAYING
export const STATE_MAIN_MENU = "MAIN_MENU";
export const STATE_CREATING_GAME = "CREATING_GAME";
export const STATE_ALLOCATING_POINTS = "ALLOCATING_POINTS";
export const STATE_DEVELOPING = "DEVELOPING";
export const STATE_REVIEWING = "REVIEWING";
export const STATE_RESEARCH_MENU = "RESEARCH_MENU";
export const STATE_VIEW_STATS = "VIEW_STATS";

// Game constants
export const STARTING_MONEY = 1000;
export const STARTING_REPUTATION = 50;
export const WIN_MONEY_THRESHOLD = 50000;
export const LOSE_MONEY_THRESHOLD = 0;
export const LOSE_REPUTATION_THRESHOLD = 0;

export const GAME_TYPES = [
  { name: "Action", unlocked: true },
  { name: "Adventure", unlocked: true },
  { name: "RPG", unlocked: false },
  { name: "Strategy", unlocked: false },
  { name: "Simulation", unlocked: false },
  { name: "Sports", unlocked: false }
];

export const TECHNOLOGIES = [
  { name: "2D Graphics", cost: 2000, researched: false, unlocks: "RPG" },
  { name: "3D Engine", cost: 5000, researched: false, unlocks: "Strategy" },
  { name: "AI System", cost: 8000, researched: false, unlocks: "Simulation" },
  { name: "Physics Engine", cost: 10000, researched: false, unlocks: "Sports" }
];

// Initial game state
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  money: STARTING_MONEY,
  reputation: STARTING_REPUTATION,
  gamePhase: PHASE_START,
  playingState: STATE_MAIN_MENU,
  controlMode: "HUMAN",
  
  // Menu navigation
  menuSelection: 0,
  maxMenuOptions: 3,
  
  // Game creation
  currentGame: null,
  gameInDevelopment: null,
  gamesCreated: 0,
  completedGames: [],
  
  // Point allocation
  designPoints: 0,
  techPoints: 0,
  marketingPoints: 0,
  totalPointsAvailable: 100,
  allocationFocus: 0, // 0: design, 1: tech, 2: marketing
  
  // Development
  developmentProgress: 0,
  developmentDuration: 180, // frames
  fastForward: false,
  
  // Review
  reviewScore: 0,
  reviewText: "",
  salesRevenue: 0,
  reviewTimer: 0,
  
  // Technologies
  technologies: JSON.parse(JSON.stringify(TECHNOLOGIES)),
  gameTypes: JSON.parse(JSON.stringify(GAME_TYPES)),
  
  // Time tracking
  year: 1980,
  week: 1,
  
  // Stats view
  showingStats: false,
  
  // Frame tracking for automated testing
  frameCount: 0,
  lastActionFrame: 0
};

// Expose gameState getter globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}

export function getGameState() {
  return gameState;
}