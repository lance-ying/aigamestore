// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 80;

export const gameState = {
  player: null,
  platforms: [],
  gems: [],
  obstacles: [],
  cosmicEnd: null,
  score: 0,
  timeEnergy: 100,
  maxTimeEnergy: 100,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN",
  scrollOffset: 0,
  difficulty: 1.0,
  rewindActive: false,
  rewindData: [],
  maxRewindFrames: 180, // 3 seconds at 60fps
  distanceTraveled: 0,
  entities: []
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}
window.getGameState = getGameState;