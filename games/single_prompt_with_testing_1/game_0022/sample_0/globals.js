// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// World settings
export const WORLD_SIZE = 300; // 3D world size
export const BUILDING_COUNT = 15;
export const ENEMY_COUNT = 8;

// Player settings
export const PLAYER_SPEED = 0.15;
export const PLAYER_SPRINT_SPEED = 0.25;
export const PLAYER_TURN_SPEED = 0.05;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_HUNGER = 100;
export const PLAYER_MAX_THIRST = 100;
export const PLAYER_MAX_RADIATION = 100;

// Depletion rates (per second)
export const HUNGER_DEPLETION = 100 / 60;
export const THIRST_DEPLETION = 100 / 60;
export const RADIATION_INCREASE = 100 / 120;
export const SPRINT_HUNGER_MULTIPLIER = 2.5;

// Combat
export const PLAYER_ATTACK_RANGE = 6;
export const PLAYER_ATTACK_DAMAGE = 25;
export const PLAYER_ATTACK_COOLDOWN = 30;

// Enemy settings
export const ENEMY_SPEED = 0.08;
export const ENEMY_ATTACK_RANGE = 4;
export const ENEMY_ATTACK_DAMAGE = 15;
export const ENEMY_HEALTH = 50;
export const ENEMY_DETECTION_RANGE = 20;

// Item settings
export const ITEM_FOOD_RESTORE = 30;
export const ITEM_WATER_RESTORE = 35;
export const ITEM_ANTIRAD_RESTORE = 40;

// Building settings
export const BUILDING_SIZE = 8;
export const BUILDING_INTERACTION_RANGE = 10;

// Evacuation point
export const EVAC_SIZE = 10;

// Game state
export const gameState = {
    player: null,
    entities: [],
    buildings: [],
    enemies: [],
    score: 0,
    gamePhase: PHASE_START,
    controlMode: "HUMAN",
    lastTime: 0,
    evacuationPoint: null,
    
    // Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    lights: [],
    
    // Tracking
    frameCount: 0,
    deltaTime: 0,
    buildingsScavenged: 0,
    enemiesDefeated: 0
};

// Logs (write-only)
export const logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
};

// Expose globally
if (typeof window !== 'undefined') {
    window.getGameState = () => gameState;
    window.logs = logs;
}