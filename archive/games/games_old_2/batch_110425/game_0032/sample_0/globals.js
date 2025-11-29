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

export const PLAY_PHASES = {
  SELECT_GENRE: "SELECT_GENRE",
  SELECT_THEME: "SELECT_THEME",
  SELECT_TALENT: "SELECT_TALENT",
  DESIGN_STUDIO: "DESIGN_STUDIO",
  PRODUCING: "PRODUCING",
  RESULTS: "RESULTS"
};

export const GENRES = [
  { id: "talk", name: "Talk Show", unlocked: true, researchCost: 0 },
  { id: "variety", name: "Variety", unlocked: false, researchCost: 50 },
  { id: "drama", name: "Drama", unlocked: false, researchCost: 100 },
  { id: "news", name: "News", unlocked: false, researchCost: 80 },
  { id: "quiz", name: "Quiz", unlocked: false, researchCost: 120 }
];

export const THEMES = [
  { id: "comedy", name: "Comedy", unlocked: true, researchCost: 0 },
  { id: "romance", name: "Romance", unlocked: false, researchCost: 60 },
  { id: "action", name: "Action", unlocked: false, researchCost: 90 },
  { id: "mystery", name: "Mystery", unlocked: false, researchCost: 110 },
  { id: "food", name: "Food", unlocked: false, researchCost: 70 }
];

export const SYNERGY_MAP = {
  "talk-comedy": 1.5,
  "talk-food": 1.2,
  "variety-comedy": 1.4,
  "variety-action": 1.3,
  "drama-romance": 1.5,
  "drama-mystery": 1.4,
  "news-action": 1.2,
  "news-mystery": 1.3,
  "quiz-comedy": 1.3,
  "quiz-mystery": 1.4
};

export const SET_PIECES = [
  { id: "desk", name: "Desk", cost: 0, atmosphere: 5, unlocked: true },
  { id: "sofa", name: "Sofa", cost: 20, atmosphere: 8, unlocked: true },
  { id: "plant", name: "Plant", cost: 15, atmosphere: 6, unlocked: true },
  { id: "screen", name: "Screen", cost: 50, atmosphere: 15, unlocked: false },
  { id: "lights", name: "Stage Lights", cost: 80, atmosphere: 20, unlocked: false },
  { id: "camera", name: "Camera", cost: 40, atmosphere: 12, unlocked: false }
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  fans: 0,
  researchPoints: 0,
  snsBuzz: 0,
  programsProduced: 0,
  stationRank: 1,
  gamePhase: GAME_PHASES.START,
  playPhase: PLAY_PHASES.SELECT_GENRE,
  controlMode: "HUMAN",
  
  // Current program being produced
  currentProgram: {
    genre: null,
    theme: null,
    host: null,
    guests: [],
    setPieces: [],
    rating: 0,
    quality: 0
  },
  
  // Available resources
  availableTalent: [],
  ownedSetPieces: [],
  
  // UI state
  selectedGenreIndex: 0,
  selectedThemeIndex: 0,
  selectedTalentIndex: 0,
  selectedSetPieceIndex: 0,
  studioGrid: [], // 8x6 grid for set placement
  cursorX: 0,
  cursorY: 0,
  
  // Production state
  productionTimer: 0,
  productionDuration: 120, // frames
  resultDisplayTimer: 0,
  resultDisplayDuration: 180
};

// Initialize game state function
export function initGameState() {
  gameState.score = 0;
  gameState.fans = 0;
  gameState.researchPoints = 0;
  gameState.snsBuzz = 0;
  gameState.programsProduced = 0;
  gameState.stationRank = 1;
  gameState.playPhase = PLAY_PHASES.SELECT_GENRE;
  
  gameState.currentProgram = {
    genre: null,
    theme: null,
    host: null,
    guests: [],
    setPieces: [],
    rating: 0,
    quality: 0
  };
  
  // Generate initial talent pool
  gameState.availableTalent = generateInitialTalent();
  gameState.ownedSetPieces = [0, 0, 0, 0, 0, 0]; // counts for each set piece type
  
  // Initialize studio grid (8x6)
  gameState.studioGrid = [];
  for (let y = 0; y < 6; y++) {
    gameState.studioGrid[y] = [];
    for (let x = 0; x < 8; x++) {
      gameState.studioGrid[y][x] = null;
    }
  }
  
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.selectedGenreIndex = 0;
  gameState.selectedThemeIndex = 0;
  gameState.selectedTalentIndex = 0;
  gameState.selectedSetPieceIndex = 0;
  gameState.productionTimer = 0;
  gameState.resultDisplayTimer = 0;
}

function generateInitialTalent() {
  const talent = [];
  const names = ["Alex", "Blake", "Casey", "Drew", "Ellis", "Finley", "Gray", "Harper"];
  
  for (let i = 0; i < 8; i++) {
    talent.push({
      id: i,
      name: names[i],
      talkSkill: 20 + Math.floor(Math.random() * 40),
      performSkill: 20 + Math.floor(Math.random() * 40),
      appealSkill: 20 + Math.floor(Math.random() * 40),
      tier: 1,
      hired: false
    });
  }
  
  return talent;
}

// Global accessor
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}