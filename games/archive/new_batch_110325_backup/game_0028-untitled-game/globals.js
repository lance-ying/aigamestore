// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Habitats
export const HABITAT_FOREST = "FOREST";
export const HABITAT_GRASSLAND = "GRASSLAND";
export const HABITAT_WETLAND = "WETLAND";

// Food types
export const FOOD_SEED = "SEED";
export const FOOD_BERRY = "BERRY";
export const FOOD_FISH = "FISH";
export const FOOD_RODENT = "RODENT";

// Actions per round
export const ACTIONS_PER_ROUND = [8, 7, 6, 5];

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  
  // Round management
  currentRound: 1,
  actionsRemaining: 8,
  totalActions: 8,
  
  // Player resources
  foodSupply: {},
  hand: [],
  
  // Habitats with birds
  habitats: {
    [HABITAT_FOREST]: [],
    [HABITAT_GRASSLAND]: [],
    [HABITAT_WETLAND]: []
  },
  
  // Score tracking
  score: 0,
  eggsLaid: 0,
  birdsPlayed: 0,
  roundGoals: [],
  roundGoalScores: [0, 0, 0, 0],
  
  // UI state
  selectedAction: null, // "PLAY_BIRD", "GAIN_FOOD", "LAY_EGGS", "DRAW_CARDS"
  selectedHabitat: null,
  selectedCardIndex: -1,
  uiMode: "ACTION_SELECT", // "ACTION_SELECT", "HABITAT_SELECT", "CARD_SELECT", "FOOD_SELECT"
  menuIndex: 0,
  foodSelectionNeeded: 0,
  selectedFoodTypes: [],
  
  // Bird deck
  birdDeck: [],
  discardPile: [],
  
  // Animation
  messageText: "",
  messageTimer: 0,
  
  // Testing
  lastActionFrame: 0,
  consecutiveIdleFrames: 0
};

// Initialize food supply
gameState.foodSupply[FOOD_SEED] = 0;
gameState.foodSupply[FOOD_BERRY] = 0;
gameState.foodSupply[FOOD_FISH] = 0;
gameState.foodSupply[FOOD_RODENT] = 0;

// Global accessor
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}