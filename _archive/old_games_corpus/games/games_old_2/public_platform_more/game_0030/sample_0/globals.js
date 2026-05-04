// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const HABITATS = {
  FOREST: "FOREST",
  GRASSLAND: "GRASSLAND",
  WETLAND: "WETLAND"
};

export const ACTIONS = {
  PLAY_BIRD: "PLAY_BIRD",
  GAIN_FOOD: "GAIN_FOOD",
  LAY_EGGS: "LAY_EGGS",
  DRAW_CARDS: "DRAW_CARDS"
};

export const FOOD_TYPES = {
  WORM: "WORM",
  SEED: "SEED",
  FISH: "FISH",
  BERRY: "BERRY"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game specific state
  round: 1,
  maxRounds: 4,
  turnsThisRound: 0,
  maxTurnsPerRound: 8,
  
  // Player resources
  food: {
    [FOOD_TYPES.WORM]: 0,
    [FOOD_TYPES.SEED]: 0,
    [FOOD_TYPES.FISH]: 0,
    [FOOD_TYPES.BERRY]: 0
  },
  
  // Birds in hand and on board
  handCards: [],
  board: {
    [HABITATS.FOREST]: [],
    [HABITATS.GRASSLAND]: [],
    [HABITATS.WETLAND]: []
  },
  
  // Available birds to draw
  availableBirds: [],
  
  // UI state
  selectedAction: null,
  selectedHabitat: null,
  selectedCardIndex: -1,
  selectedBirdSlot: -1,
  showingMessage: false,
  message: "",
  messageTimer: 0,
  
  // Action phase tracking
  actionPhase: "SELECT_ACTION", // SELECT_ACTION, SELECT_CARD, SELECT_HABITAT, SELECT_SLOT, CONFIRM
  
  // Animation
  animating: false,
  animationTimer: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;