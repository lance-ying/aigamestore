// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const WATER_LEVEL = CANVAS_HEIGHT - 30;
export const GROUND_LEVEL = CANVAS_HEIGHT - 50;
export const TURN_TIME = 30;

export const WEAPON_TYPES = {
  BAZOOKA: { name: 'Bazooka', damage: 35, radius: 40, color: [255, 100, 0] },
  GRENADE: { name: 'Grenade', damage: 45, radius: 50, color: [100, 255, 100] },
  AIRSTRIKE: { name: 'Airstrike', damage: 30, radius: 35, color: [255, 255, 0] }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  engine: null,
  world: null,
  playerWorms: [],
  enemyWorms: [],
  terrain: [],
  projectiles: [],
  explosions: [],
  currentTeam: 'player', // 'player' or 'enemy'
  currentWormIndex: 0,
  turnTimer: TURN_TIME,
  selectedWeapon: 'BAZOOKA',
  aimAngle: -45,
  power: 50,
  wind: 0,
  hasShot: false,
  waitingForProjectile: false
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;