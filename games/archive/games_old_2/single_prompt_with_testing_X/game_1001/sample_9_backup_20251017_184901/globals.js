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
  stage: null,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentStageIndex: 0,
  defeatedBosses: [],
  playerWeapons: [],
  selectedWeapon: 0,
  cameraX: 0,
  particles: [],
  wilyStageIndex: 0,
  inBossRoom: false,
  bossDefeated: false,
  stageCleared: false,
  transitionTimer: 0,
  checkpointX: 0
};

export const ROBOT_MASTERS = [
  { name: "CUT MAN", color: [200, 50, 50], weakness: "SUPER ARM" },
  { name: "GUTS MAN", color: [150, 100, 50], weakness: "CUT BLADE" },
  { name: "ICE MAN", color: [100, 150, 255], weakness: "THUNDER BEAM" },
  { name: "BOMB MAN", color: [220, 180, 50], weakness: "ICE SLASHER" },
  { name: "FIRE MAN", color: [255, 100, 50], weakness: "GUTS BUSTER" },
  { name: "ELEC MAN", color: [255, 255, 100], weakness: "FIRE STORM" }
];

export const WEAPON_DATA = {
  "MEGA BUSTER": { energy: Infinity, damage: 1, color: [200, 200, 255] },
  "CUT BLADE": { energy: 28, damage: 2, color: [200, 50, 50] },
  "GUTS BUSTER": { energy: 28, damage: 2, color: [150, 100, 50] },
  "ICE SLASHER": { energy: 28, damage: 2, color: [100, 150, 255] },
  "BOMB BLASTER": { energy: 28, damage: 2, color: [220, 180, 50] },
  "FIRE STORM": { energy: 28, damage: 2, color: [255, 100, 50] },
  "THUNDER BEAM": { energy: 28, damage: 2, color: [255, 255, 100] },
  "MAGNET BEAM": { energy: 28, damage: 0, color: [255, 50, 255] }
};