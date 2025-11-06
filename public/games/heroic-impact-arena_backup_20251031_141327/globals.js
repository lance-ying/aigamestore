// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_TRANSITION: "LEVEL_TRANSITION",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLAYER_MODE = {
  CHARACTER_SELECT: "CHARACTER_SELECT",
  ABILITY_SELECT: "ABILITY_SELECT",
  TARGET_SELECT: "TARGET_SELECT",
  ACTION_RESOLVE: "ACTION_RESOLVE"
};

export const TURN_PHASE = {
  PLAYER: "PLAYER",
  ENEMY: "ENEMY"
};

export const ELEMENT_TYPE = {
  FIRE: "FIRE",
  WATER: "WATER",
  NATURE: "NATURE",
  NONE: "NONE"
};

export const STATUS_EFFECT = {
  STUN: "STUN",
  HEAL_OVER_TIME: "HEAL_OVER_TIME",
  DEFENSE_UP: "DEFENSE_UP"
};

export const gameState = {
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  playerCharacters: [],
  enemyCharacters: [],
  activeTurn: TURN_PHASE.PLAYER,
  playerMode: PLAYER_MODE.CHARACTER_SELECT,
  currentSelectedCharacterIndex: 0,
  currentSelectedAbilityIndex: 0,
  currentSelectedTargetIndex: 0,
  currentActingHeroIndex: 0,
  turnCounter: 0,
  score: 0,
  currentLevel: 1,
  maxLevel: 5,
  animationQueue: [],
  particles: [],
  levelTransitionTimer: 0,
  targetTurnsForBonus: [6, 8, 10, 12, 15],
  highScores: [],
  inputBuffer: []
};

export function getGameState() {
  return gameState;
}

// Attach to window for external access
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}