// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CATEGORIES = [
  { id: 'ones', name: 'Ones', upper: true },
  { id: 'twos', name: 'Twos', upper: true },
  { id: 'threes', name: 'Threes', upper: true },
  { id: 'fours', name: 'Fours', upper: true },
  { id: 'fives', name: 'Fives', upper: true },
  { id: 'sixes', name: 'Sixes', upper: true },
  { id: 'three_kind', name: 'Three of a Kind', upper: false },
  { id: 'four_kind', name: 'Four of a Kind', upper: false },
  { id: 'full_house', name: 'Full House', upper: false },
  { id: 'small_straight', name: 'Small Straight', upper: false },
  { id: 'large_straight', name: 'Large Straight', upper: false },
  { id: 'kniffel', name: 'Kniffel', upper: false },
  { id: 'chance', name: 'Chance', upper: false }
];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Players
  players: [],
  currentPlayerIndex: 0,
  
  // Turn state
  rollsLeft: 3,
  diceValues: [1, 1, 1, 1, 1],
  diceHeld: [false, false, false, false, false],
  selectedDiceIndex: -1,
  
  // Scoring
  selectedCategoryIndex: 0,
  mustSelectCategory: false,
  
  // Round tracking
  currentRound: 0,
  totalRounds: 13,
  
  // UI state
  showDiceAnimation: false,
  animationFrame: 0,
  
  // Winner info
  winner: null,
  winnerScore: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;