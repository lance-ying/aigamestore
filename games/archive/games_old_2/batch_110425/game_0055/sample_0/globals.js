// Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const GROUND_Y = 340;

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  bosses: [],
  particles: [],
  score: 0,
  wave: 0,
  maxWave: 3,
  bossDefeated: false,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  narrator: {
    active: false,
    message: "",
    timer: 0,
    defyCount: 0,
    followCount: 0,
    suggestedDirection: null, // "left", "right", null
    playerFollowing: false
  },
  secrets: {
    foundHiddenArea: false,
    defiedNarrator: false,
    exploredBoundaries: false,
    unlockedSecretEnding: false
  },
  combo: 0,
  maxCombo: 0,
  lastHitTime: 0,
  cameraX: 0,
  worldBounds: { left: -200, right: 800 }
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function resetGameState() {
  gameState.entities = [];
  gameState.enemies = [];
  gameState.bosses = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.wave = 0;
  gameState.bossDefeated = false;
  gameState.narrator.active = false;
  gameState.narrator.timer = 0;
  gameState.narrator.defyCount = 0;
  gameState.narrator.followCount = 0;
  gameState.narrator.suggestedDirection = null;
  gameState.secrets.foundHiddenArea = false;
  gameState.secrets.defiedNarrator = false;
  gameState.secrets.exploredBoundaries = false;
  gameState.secrets.unlockedSecretEnding = false;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.lastHitTime = 0;
  gameState.cameraX = 0;
}