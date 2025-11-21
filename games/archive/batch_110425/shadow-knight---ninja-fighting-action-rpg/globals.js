// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GROUND_Y = 340;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;

export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 50;
export const PLAYER_SPEED = 4;

export const ENEMY_WIDTH = 35;
export const ENEMY_HEIGHT = 45;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const PHASE_MISSION_COMPLETE = "MISSION_COMPLETE";
export const PHASE_UPGRADE_SCREEN = "UPGRADE_SCREEN";

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";
export const CONTROL_TEST_3 = "TEST_3";
export const CONTROL_TEST_4 = "TEST_4";

// Mission configuration
export const MISSIONS = [
  { enemies: 3, enemyHealth: 50, enemyDamage: 10, gold: 30, name: "Forest Goblins" },
  { enemies: 4, enemyHealth: 70, enemyDamage: 15, gold: 50, name: "Dark Wolves" },
  { enemies: 5, enemyHealth: 90, enemyDamage: 20, gold: 70, name: "Shadow Orcs" },
  { enemies: 4, enemyHealth: 120, enemyDamage: 25, gold: 100, name: "Demon Warriors" },
  { enemies: 1, enemyHealth: 300, enemyDamage: 30, gold: 200, name: "Dark Lord" }
];

// Skill cooldowns (in seconds)
export const SKILL_COOLDOWNS = {
  shadowStrike: 5,
  ninjaFury: 12
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  goldDrops: [],
  particles: [],
  score: 0,
  goldCollected: 0,
  currentMission: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  missionStartTime: 0,
  upgradePoints: 0,
  playerStats: {
    maxHealth: 100,
    health: 100,
    attackDamage: 20,
    attackLevel: 0,
    healthLevel: 0
  },
  skills: {
    shadowStrike: { cooldown: 0, maxCooldown: SKILL_COOLDOWNS.shadowStrike * TARGET_FPS },
    ninjaFury: { cooldown: 0, maxCooldown: SKILL_COOLDOWNS.ninjaFury * TARGET_FPS }
  },
  camera: {
    x: 0,
    y: 0
  },
  testData: {
    positionHistory: [],
    lastActionTime: 0,
    stuckCounter: 0
  }
};