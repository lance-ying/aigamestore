// globals.js - Game constants and state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 320;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Weapon types
export const WEAPON_BAZOOKA = "BAZOOKA";
export const WEAPON_DIGGER = "DIGGER";
export const WEAPON_CLUSTER = "CLUSTER";

export const WEAPONS = [
  { name: WEAPON_BAZOOKA, damage: 50, blastRadius: 30, unlockScore: 0, color: [255, 100, 0] },
  { name: WEAPON_DIGGER, damage: 30, blastRadius: 50, unlockScore: 100, color: [150, 75, 0] },
  { name: WEAPON_CLUSTER, damage: 25, blastRadius: 20, unlockScore: 200, color: [255, 200, 0] }
];

// Game state - central state object
export const gameState = {
  player: null,
  enemies: [],
  entities: [],
  projectiles: [],
  particles: [],
  terrain: null,
  currentTurn: 'player', // 'player' or enemy index
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  windSpeed: 0,
  windDirection: 1,
  playerAngle: 45,
  playerPower: 50,
  currentWeaponIndex: 0,
  unlockedWeapons: [WEAPON_BAZOOKA],
  turnTimer: 0,
  maxTurnTime: 180, // 3 seconds at 60 FPS
  cameraShake: 0,
  shotsThisTurn: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}