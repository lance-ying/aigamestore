export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRAVITY = 0.6;
export const JUMP_VELOCITY = -12;
export const MOVE_SPEED = 4;
export const ATTACK_DURATION = 15;
export const DAMAGE_FLASH_DURATION = 10;

export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  items: [],
  enemies: [],
  particles: [],
  score: 0,
  currentLevel: 1,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED", "LEVEL_COMPLETE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  framesSinceStart: 0,
  levelObjectivesMet: false,
  bossDefeated: false,
  highScores: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}