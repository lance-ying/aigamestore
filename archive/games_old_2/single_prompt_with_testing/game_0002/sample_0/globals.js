// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.4;
export const GROUND_HEIGHT = 350;

export const PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  PAUSED: "PAUSED"
};

export const TURN_PHASES = {
  MOVEMENT: "MOVEMENT",
  ATTACK: "ATTACK",
  FIRING: "FIRING",
  SWITCHING: "SWITCHING"
};

export const WEAPON_TYPES = {
  BAZOOKA: "BAZOOKA",
  GRENADE: "GRENADE",
  SHOTGUN: "SHOTGUN"
};

export const gameState = {
  player: null,
  entities: [],
  terrain: null,
  projectiles: [],
  explosions: [],
  particles: [],
  score: 0,
  gamePhase: PHASES.START,
  controlMode: "HUMAN",
  currentTeam: 0, // 0 for player team, 1 for enemy team
  currentWormIndex: 0,
  turnPhase: TURN_PHASES.MOVEMENT,
  movementTimer: 0,
  attackTimer: 0,
  movementLimit: 100,
  currentMovement: 0,
  aimAngle: -45,
  aimPower: 50,
  selectedWeapon: WEAPON_TYPES.BAZOOKA,
  playerWorms: [],
  enemyWorms: [],
  missionComplete: false,
  winCoins: 0,
  winXP: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}