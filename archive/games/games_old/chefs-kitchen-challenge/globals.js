export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const MINIGAME_TYPES = {
  CHOP: "CHOP",
  MIX: "MIX",
  COOK: "COOK"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  currentRecipeIndex: 0,
  currentStepIndex: 0,
  currentMinigame: null,
  recipes: [],
  lives: 3,
  levelProgress: {
    recipesCompleted: 0,
    totalRecipes: 0
  }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;