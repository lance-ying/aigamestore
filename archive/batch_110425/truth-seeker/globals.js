// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  INVESTIGATION: "INVESTIGATION",
  CLASS_TRIAL: "CLASS_TRIAL",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Chapter management
  currentChapter: 1,
  maxChapters: 3,
  
  // Investigation phase
  truthBullets: [],
  collectedBullets: [],
  evidencePoints: [],
  
  // Class Trial phase
  trialStatements: [],
  currentStatement: null,
  statementProgress: 0,
  liesFound: 0,
  totalLies: 0,
  trialTimeRemaining: 0,
  slowMoCharges: 3,
  slowMoActive: false,
  slowMoDuration: 0,
  
  // Gameplay
  health: 3,
  combo: 0,
  maxCombo: 0
};

// Chapter data
export const CHAPTER_DATA = [
  {
    chapter: 1,
    title: "The First Trial",
    evidenceCount: 3,
    lies: 2,
    trialTime: 45,
    difficulty: 1
  },
  {
    chapter: 2,
    title: "Hidden Motives",
    evidenceCount: 4,
    lies: 3,
    trialTime: 40,
    difficulty: 1.3
  },
  {
    chapter: 3,
    title: "Final Confrontation",
    evidenceCount: 5,
    lies: 4,
    trialTime: 35,
    difficulty: 1.6
  }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;