export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  particles: [],
  platforms: [],
  hazards: [],
  collectibles: [],
  saveStations: [],
  boss: null,
  camera: { x: 0, y: 0 },
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  levelWidth: 3000,
  levelHeight: 800,
  bossDefeated: false,
  currentStage: 0
};

export const WEAPON_TYPES = {
  PISTOL: 0,
  MACHINE_GUN: 1,
  FIREBALL: 2,
  BLADE: 3,
  MISSILE: 4
};

export const WEAPON_DATA = [
  { name: "Pistol", maxAmmo: -1, color: [100, 200, 255] },
  { name: "Machine Gun", maxAmmo: 100, color: [255, 200, 100] },
  { name: "Fireball", maxAmmo: 50, color: [255, 100, 50] },
  { name: "Blade", maxAmmo: 30, color: [200, 100, 255] },
  { name: "Missile", maxAmmo: 10, color: [255, 50, 50] }
];